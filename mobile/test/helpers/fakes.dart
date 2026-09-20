import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/app.dart';
import 'package:opensen/core/di/providers.dart';
import 'package:opensen/core/platform/export_sink.dart';
import 'package:opensen/core/platform/speech_synthesizer.dart';
import 'package:opensen/data/seed/seed_content.dart';
import 'package:opensen/domain/entities/chunk.dart';
import 'package:opensen/domain/entities/dialogue.dart';
import 'package:opensen/domain/entities/learner_settings.dart';
import 'package:opensen/domain/entities/practice.dart';
import 'package:opensen/domain/entities/sentence_pattern.dart';
import 'package:opensen/domain/entities/situation.dart';
import 'package:opensen/domain/repositories/content_repository.dart';
import 'package:opensen/domain/repositories/practice_repository.dart';
import 'package:opensen/domain/repositories/settings_repository.dart';
import 'package:opensen/domain/services/clock.dart';
import 'package:opensen/domain/services/dialogue_composer.dart';
import 'package:opensen/domain/services/id_generator.dart';

/// The bundled seed, read synchronously so it works inside fake-async tests.
SeedBundle loadSeedBundle() =>
    SeedBundle.parse(File('assets/seed/content.json').readAsStringSync());

/// Pure in-memory content graph for widget and use-case tests.
class InMemoryContentRepository implements ContentRepository {
  InMemoryContentRepository();

  factory InMemoryContentRepository.fromSeed(SeedBundle bundle) {
    final repo = InMemoryContentRepository();
    for (final s in bundle.situations) {
      repo.situations[s.id] = s;
    }
    for (final p in bundle.patterns) {
      repo.patterns[p.id] = p;
    }
    for (final c in bundle.chunks) {
      repo.chunks[c.id] = c;
    }
    for (final d in bundle.dialogues) {
      repo.dialogues[d.id] = d;
    }
    return repo;
  }

  final Map<String, Situation> situations = <String, Situation>{};
  final Map<String, SentencePattern> patterns = <String, SentencePattern>{};
  final Map<String, Chunk> chunks = <String, Chunk>{};
  final Map<String, Dialogue> dialogues = <String, Dialogue>{};
  int _variantCounter = 0;

  @override
  Future<List<Situation>> listSituations({bool? templates}) async =>
      situations.values
          .where((s) => templates == null || s.isTemplate == templates)
          .toList();

  @override
  Future<Situation?> getSituation(String id) async => situations[id];

  @override
  Future<List<SentencePattern>> listPatterns({
    String? situationId,
    Set<String>? ids,
  }) async =>
      patterns.values
          .where(
            (p) => situationId == null || p.situationIds.contains(situationId),
          )
          .where((p) => ids == null || ids.contains(p.id))
          .toList();

  @override
  Future<SentencePattern?> getPattern(String id) async => patterns[id];

  @override
  Future<List<Chunk>> listChunks({
    String? situationId,
    String? patternId,
    String? query,
    Set<String>? ids,
  }) async {
    final needle = query?.trim().toLowerCase();
    return chunks.values
        .where((c) => situationId == null || c.situationId == situationId)
        .where((c) => patternId == null || c.patternId == patternId)
        .where((c) => ids == null || ids.contains(c.id))
        .where(
          (c) => needle == null ||
              needle.isEmpty ||
              c.text.toLowerCase().contains(needle) ||
              c.meaning.toLowerCase().contains(needle),
        )
        .toList();
  }

  @override
  Future<Chunk?> getChunk(String id) async => chunks[id];

  @override
  Future<Chunk?> findChunkByText(String text) async {
    final wanted = text.trim().toLowerCase();
    for (final chunk in chunks.values) {
      if (chunk.text.toLowerCase() == wanted) return chunk;
    }
    return null;
  }

  @override
  Future<List<Dialogue>> listDialogues({
    String? situationId,
    bool? templates,
  }) async =>
      dialogues.values
          .where((d) => situationId == null || d.situationId == situationId)
          .where((d) => templates == null || d.isTemplate == templates)
          .toList();

  @override
  Future<Dialogue?> getDialogue(String id) async => dialogues[id];

  @override
  Future<void> saveComposedDialogue(ComposedDialogue composed) async {
    situations[composed.situation.id] = composed.situation;
    for (final chunk in composed.newChunks) {
      chunks.putIfAbsent(chunk.id, () => chunk);
    }
    dialogues[composed.dialogue.id] = composed.dialogue;
  }

  @override
  Future<void> deleteDialogue(String id) async {
    dialogues.remove(id);
  }

  @override
  Future<void> savePattern(SentencePattern pattern) async {
    patterns[pattern.id] = pattern;
  }

  @override
  Future<void> saveChunk(Chunk chunk) async {
    chunks[chunk.id] = chunk;
  }

  @override
  Future<void> deleteChunk(String id) async {
    chunks.remove(id);
  }

  @override
  Future<SlotVariant> addSlotVariant(
    String slotId,
    String text, {
    String? meaning,
    bool isValidated = false,
  }) async {
    final variant = SlotVariant(
      id: 'variant-${++_variantCounter}',
      slotId: slotId,
      text: text,
      meaning: meaning,
      isValidated: isValidated,
    );
    for (final entry in patterns.entries) {
      final slots = entry.value.slots;
      final index = slots.indexWhere((slot) => slot.id == slotId);
      if (index < 0) continue;
      final updatedSlots = List<PatternSlot>.from(slots);
      updatedSlots[index] = slots[index].copyWith(
        variants: <SlotVariant>[...slots[index].variants, variant],
      );
      patterns[entry.key] = entry.value.copyWith(slots: updatedSlots);
      break;
    }
    return variant;
  }
}

class InMemoryPracticeRepository implements PracticeRepository {
  final Map<String, UserChunkState> states = <String, UserChunkState>{};
  final List<ReviewRecord> history = <ReviewRecord>[];
  final List<PracticeAttempt> attempts = <PracticeAttempt>[];

  @override
  Future<UserChunkState?> getState(String chunkId) async => states[chunkId];

  @override
  Future<Map<String, UserChunkState>> getStates(
    Iterable<String> chunkIds,
  ) async =>
      <String, UserChunkState>{
        for (final id in chunkIds)
          if (states[id] != null) id: states[id]!,
      };

  @override
  Future<Set<String>> enrolledChunkIds() async => states.keys.toSet();

  @override
  Future<void> enroll(Iterable<String> chunkIds, DateTime now) async {
    for (final id in chunkIds) {
      states.putIfAbsent(id, () => UserChunkState.initial(id, now));
    }
  }

  @override
  Future<void> unenroll(String chunkId) async {
    states.remove(chunkId);
  }

  @override
  Future<List<UserChunkState>> listDue(DateTime now, {int limit = 50}) async {
    final due = states.values.where((s) => s.isDue(now)).toList()
      ..sort((a, b) {
        final aNew = a.status == ChunkStatus.fresh ? 1 : 0;
        final bNew = b.status == ChunkStatus.fresh ? 1 : 0;
        if (aNew != bNew) return aNew - bNew;
        return (a.nextReview ?? now).compareTo(b.nextReview ?? now);
      });
    return due.take(limit).toList();
  }

  @override
  Future<List<UserChunkState>> listUpcoming(
    DateTime now, {
    int limit = 20,
  }) async {
    final upcoming = states.values.where((s) => !s.isDue(now)).toList()
      ..sort((a, b) => a.nextReview!.compareTo(b.nextReview!));
    return upcoming.take(limit).toList();
  }

  @override
  Future<int> countNewIntroducedSince(DateTime since) async => history
      .where(
        (r) => r.stateBefore == ChunkStatus.fresh && !r.reviewTime.isBefore(since),
      )
      .length;

  @override
  Future<void> recordReview({
    required UserChunkState state,
    required ReviewRecord record,
    PracticeAttempt? attempt,
  }) async {
    states[state.chunkId] = state;
    history.add(record);
    if (attempt != null) attempts.add(attempt);
  }

  @override
  Future<List<ReviewRecord>> listHistory({int limit = 100}) async =>
      history.reversed.take(limit).toList();

  @override
  Future<PlanStats> planStats(DateTime now) async {
    final byStatus = <ChunkStatus, int>{};
    for (final state in states.values) {
      byStatus[state.status] = (byStatus[state.status] ?? 0) + 1;
    }
    final todayStart = DayBoundary.startOfLocalDay(now);
    return PlanStats(
      total: states.length,
      byStatus: byStatus,
      dueNow: states.values.where((s) => s.isDue(now)).length,
      dueNext7Days: List<int>.generate(7, (day) {
        final end = DayBoundary.startOfLocalDayOffset(now, day + 1);
        final start = DayBoundary.startOfLocalDayOffset(now, day);
        return states.values.where((s) {
          final due = s.nextReview;
          if (day == 0) return due == null || due.isBefore(end);
          return due != null && !due.isBefore(start) && due.isBefore(end);
        }).length;
      }),
      reviewedToday:
          history.where((r) => !r.reviewTime.isBefore(todayStart)).length,
      streakDays: history.isEmpty ? 0 : 1,
    );
  }

  @override
  Future<void> resetProgress() async {
    states.clear();
    history.clear();
    attempts.clear();
  }
}

class InMemorySettingsRepository implements SettingsRepository {
  InMemorySettingsRepository([this.settings = const LearnerSettings()]);

  LearnerSettings settings;

  @override
  Future<LearnerSettings> load() async => settings;

  @override
  Future<void> save(LearnerSettings settings) async {
    this.settings = settings;
  }
}

class RecordingExportSink implements ExportSink {
  final List<String> fileNames = <String>[];
  final List<String> contents = <String>[];

  @override
  Future<void> deliver({
    required String fileName,
    required String content,
    String? message,
  }) async {
    fileNames.add(fileName);
    contents.add(content);
  }
}

/// Wiring for widget tests: seed-backed in-memory repositories, a silent
/// speech engine, deterministic ids and a fixed clock.
class TestHarness {
  TestHarness({
    SeedBundle? bundle,
    LearnerSettings settings = const LearnerSettings(onboardingComplete: true),
    DateTime? now,
  })  : content = InMemoryContentRepository.fromSeed(bundle ?? loadSeedBundle()),
        practice = InMemoryPracticeRepository(),
        settingsRepository = InMemorySettingsRepository(settings),
        clock = FixedClock(now ?? DateTime.utc(2026, 9, 20, 9)),
        initialSettings = settings;

  final InMemoryContentRepository content;
  final InMemoryPracticeRepository practice;
  final InMemorySettingsRepository settingsRepository;
  final FixedClock clock;
  final LearnerSettings initialSettings;
  final RecordingExportSink exportSink = RecordingExportSink();

  Widget buildApp() => ProviderScope(
        overrides: [
          contentRepositoryProvider.overrideWith((ref) => content),
          practiceRepositoryProvider.overrideWith((ref) => practice),
          settingsRepositoryProvider.overrideWith((ref) => settingsRepository),
          initialSettingsProvider.overrideWith((ref) => initialSettings),
          clockProvider.overrideWith((ref) => clock),
          idGeneratorProvider.overrideWith((ref) => SequentialIdGenerator()),
          speechSynthesizerProvider.overrideWith(
            (ref) => const SilentSpeechSynthesizer(),
          ),
          exportSinkProvider.overrideWith((ref) => exportSink),
        ],
        child: const OpenSenApp(),
      );
}

/// Pumps the app on a tall phone-sized surface so lists render fully and
/// buttons below the fold stay tappable.
Future<void> pumpApp(WidgetTester tester, TestHarness harness) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(harness.buildApp());
  await tester.pumpAndSettle();
}
