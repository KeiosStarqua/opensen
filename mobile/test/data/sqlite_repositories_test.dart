import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/data/db/app_database.dart';
import 'package:opensen/data/repositories/sqlite_content_repository.dart';
import 'package:opensen/data/repositories/sqlite_practice_repository.dart';
import 'package:opensen/data/repositories/sqlite_settings_repository.dart';
import 'package:opensen/data/seed/seed_importer.dart';
import 'package:opensen/domain/entities/chunk.dart';
import 'package:opensen/domain/entities/learner_settings.dart';
import 'package:opensen/domain/entities/practice.dart';
import 'package:opensen/domain/entities/register.dart';
import 'package:opensen/domain/services/clock.dart';
import 'package:opensen/domain/services/dialogue_composer.dart';
import 'package:opensen/domain/services/fsrs/fsrs_parameters.dart';
import 'package:opensen/domain/services/fsrs/fsrs_scheduler.dart';
import 'package:opensen/domain/services/id_generator.dart';
import 'package:opensen/domain/usecases/build_dialogue.dart';
import 'package:opensen/domain/usecases/create_custom_chunk.dart';
import 'package:opensen/domain/usecases/export_anki.dart';
import 'package:opensen/domain/usecases/record_review.dart';
import 'package:opensen/domain/usecases/start_practice_session.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();
  late Database db;
  late SqliteContentRepository content;
  late SqlitePracticeRepository practice;
  late FixedClock clock;
  late SequentialIdGenerator ids;

  setUpAll(sqfliteFfiInit);

  setUp(() async {
    db = await AppDatabase.open(
      factory: databaseFactoryFfi,
      path: inMemoryDatabasePath,
    );
    ids = SequentialIdGenerator(prefix: 'test');
    content = SqliteContentRepository(db, ids: ids);
    practice = SqlitePracticeRepository(db);
    clock = FixedClock(DateTime.utc(2026, 9, 20, 9));
    await SeedImporter(db).import(bundle);
  });

  tearDown(() => db.close());

  group('SeedImporter', () {
    test('imports once per version and is idempotent', () async {
      final importer = SeedImporter(db);
      expect(await importer.currentVersion(), bundle.version);
      expect(await importer.importIfNeeded(bundle), isFalse);
      await importer.import(bundle);
      expect(await content.listChunks(), hasLength(bundle.chunks.length));
      expect(await content.listSituations(templates: true), hasLength(bundle.situations.length));
    });
  });

  group('SqliteContentRepository', () {
    test('hydrates patterns with slots, variants, intents and situations', () async {
      final pattern = await content.getPattern('pat_tell_me_more');
      expect(pattern, isNotNull);
      expect(pattern!.slots.single.name, 'topic');
      expect(pattern.slots.single.variants.map((v) => v.text), contains('your research'));
      expect(pattern.slots.single.variants.first.text, 'your research');
      expect(pattern.intentNames, contains('ask_for_information'));
      expect(pattern.situationIds, containsAll(<String>['sit_professor', 'sit_interview']));

      final forProfessor = await content.listPatterns(situationId: 'sit_professor');
      expect(forProfessor.map((p) => p.id), contains('pat_tell_me_more'));
      expect(forProfessor.map((p) => p.id), isNot(contains('pat_table_for')));
    });

    test('searches chunks by text or meaning and reads slot fills back', () async {
      final byText = await content.listChunks(query: 'allergic');
      expect(byText.map((c) => c.id), contains('chk_allergic'));
      final byMeaning = await content.listChunks(query: 'dosage');
      expect(byMeaning.map((c) => c.id), contains('chk_how_often_take'));
      final chunk = await content.getChunk('chk_tell_me_more');
      expect(chunk!.slotFills, <String, String>{'topic': 'your research'});
      expect(await content.findChunkByText('could you tell me more about your research?'), isNotNull);
      expect(await content.listChunks(ids: <String>{}), isEmpty);
    });

    test('loads dialogues with ordered lines and chunk links', () async {
      final dialogue = await content.getDialogue('dlg_professor');
      expect(dialogue, isNotNull);
      expect(dialogue!.lines.map((l) => l.position), List<int>.generate(dialogue.lines.length, (i) => i));
      expect(dialogue.lines.first.chunkIds, <String>['chk_interested_in']);
      expect(dialogue.chunkIds, contains('chk_thank_time'));
      final templates = await content.listDialogues(situationId: 'sit_professor', templates: true);
      expect(templates.single.id, 'dlg_professor');
    });

    test('saves and deletes a custom chunk with its pattern', () async {
      final useCase = CreateCustomChunkUseCase(content: content, ids: ids, clock: clock);
      final chunk = await useCase(
        const CustomChunkInput(
          frame: "I'm allergic to {thing}, unfortunately.",
          meaning: 'Warn about an allergy with regret.',
          register: Register.neutral,
          level: 'A2',
          situationId: 'sit_restaurant',
          variantsBySlot: <String, List<String>>{
            'thing': <String>['cats', 'pollen'],
          },
        ),
      );
      expect(chunk.text, "I'm allergic to cats, unfortunately.");
      expect(chunk.isTemplate, isFalse);
      final pattern = await content.getPattern(chunk.patternId!);
      expect(pattern!.slots.single.variants.map((v) => v.text), <String>['cats', 'pollen']);
      expect(pattern.situationIds, <String>['sit_restaurant']);

      await expectLater(
        useCase(
          const CustomChunkInput(
            frame: "I'm allergic to cats, unfortunately.",
            meaning: 'dup',
            register: Register.neutral,
            level: 'A2',
          ),
        ),
        throwsA(isA<CustomChunkException>()),
      );

      await practice.enroll(<String>[chunk.id], clock.now());
      await content.deleteChunk(chunk.id);
      expect(await content.getChunk(chunk.id), isNull);
      expect(await practice.getState(chunk.id), isNull);
    });

    test('adds learner variants to a slot', () async {
      final before = await content.getPattern('pat_allergic');
      final slot = before!.slots.single;
      final variant = await content.addSlotVariant(slot.id, 'dust');
      expect(variant.isValidated, isFalse);
      expect(variant.position, slot.variants.length);
      final after = await content.getPattern('pat_allergic');
      expect(after!.slots.single.variants.last.text, 'dust');
      expect(after.slots.single.validatedVariants.length, slot.variants.length);
    });
  });

  group('BuildDialogueUseCase on SQLite', () {
    test('persists a personal dialogue, situation and chunk instances', () async {
      final useCase = BuildDialogueUseCase(content: content, ids: ids, clock: clock);
      final dialogue = await useCase(
        const DialogueRequest(
          templateSituationId: 'sit_hotel',
          roleSelf: 'Guest',
          roleOther: 'Front desk',
          goal: 'Check in',
          tone: Register.polite,
          level: 'B1',
          title: 'My Hanoi check-in',
          fills: <String, String>{'name': 'Pham', 'destination': 'the old quarter'},
        ),
      );
      final stored = await content.getDialogue(dialogue.id);
      expect(stored, isNotNull);
      expect(stored!.title, 'My Hanoi check-in');
      expect(stored.isTemplate, isFalse);
      expect(stored.lines[1].text, contains('under the name Pham.'));

      final situation = await content.getSituation(stored.situationId);
      expect(situation!.isTemplate, isFalse);
      expect(situation.sourceTemplateId, 'sit_hotel');

      final instances = await content.listChunks(situationId: situation.id);
      expect(instances.map((c) => c.text), containsAll(<String>[
        'I have a reservation under the name Pham.',
        'Could you call me a taxi to the old quarter?',
      ]));
      expect(await content.listDialogues(templates: false), hasLength(1));

      // Building again with the same fills reuses the existing instances.
      final again = await useCase(
        const DialogueRequest(
          templateSituationId: 'sit_hotel',
          roleSelf: 'Guest',
          roleOther: 'Front desk',
          goal: 'Check in',
          tone: Register.polite,
          level: 'B1',
          fills: <String, String>{'name': 'Pham'},
        ),
      );
      final reused = await content.listChunks(query: 'under the name Pham');
      expect(reused, hasLength(1));
      expect(again.chunkIds, contains(reused.single.id));

      await content.deleteDialogue(again.id);
      expect(await content.getDialogue(again.id), isNull);
      expect(await content.getSituation(again.situationId), isNull,
          reason: 'orphan learner situation is removed');
      expect(await content.getSituation(situation.id), isNotNull,
          reason: 'situation still referenced by its chunks stays');
    });

    test('fails clearly for an unknown situation', () async {
      final useCase = BuildDialogueUseCase(content: content, ids: ids, clock: clock);
      await expectLater(
        useCase(
          const DialogueRequest(
            templateSituationId: 'nope',
            roleSelf: '',
            roleOther: '',
            goal: '',
            tone: Register.neutral,
            level: 'A1',
          ),
        ),
        throwsA(isA<DialogueBuildException>()),
      );
    });
  });

  group('SqlitePracticeRepository', () {
    test('enrolls, lists due, records reviews and computes plan stats', () async {
      final now = clock.now();
      await practice.enroll(<String>['chk_allergic', 'chk_table_for', 'chk_id_like'], now);
      await practice.enroll(<String>['chk_allergic'], now.add(const Duration(days: 1)));
      expect(await practice.enrolledChunkIds(), hasLength(3));
      final state = await practice.getState('chk_allergic');
      expect(state!.status, ChunkStatus.fresh);
      expect(state.nextReview, now, reason: 'second enroll is ignored');

      final due = await practice.listDue(now);
      expect(due, hasLength(3));
      expect(await practice.listDue(now, limit: 2), hasLength(2));
      expect(await practice.listUpcoming(now), isEmpty);

      final scheduler = FsrsScheduler(FsrsParameters());
      final record = RecordReviewUseCase(
        practice: practice,
        scheduler: scheduler,
        clock: clock,
        ids: ids,
      );
      final next = await record(
        state: state,
        rating: ReviewRating.easy,
        item: const PracticeItem(
          chunkId: 'chk_allergic',
          mode: PracticeMode.l1ToL2,
          prompt: 'State an allergy.',
          expected: "I'm allergic to peanuts.",
        ),
        transcript: "I'm allergic to peanuts",
        matchScore: 0.97,
      );
      expect(next.status, ChunkStatus.review);
      expect((await practice.getState('chk_allergic'))!.reps, 1);
      expect(await practice.countNewIntroducedSince(DayBoundary.startOfLocalDay(now)), 1);
      final history = await practice.listHistory();
      expect(history.single.rating, ReviewRating.easy);
      expect(history.single.stateBefore, ChunkStatus.fresh);
      expect(history.single.practiceAttemptId, isNotNull);

      final stillDue = await practice.listDue(now);
      expect(stillDue.map((s) => s.chunkId), isNot(contains('chk_allergic')));
      final upcoming = await practice.listUpcoming(now);
      expect(upcoming.single.chunkId, 'chk_allergic');

      final stats = await practice.planStats(now);
      expect(stats.total, 3);
      expect(stats.dueNow, 2);
      expect(stats.countFor(ChunkStatus.review), 1);
      expect(stats.countFor(ChunkStatus.fresh), 2);
      expect(stats.reviewedToday, 1);
      expect(stats.streakDays, 1);
      expect(stats.dueNext7Days.first, 2);
      expect(stats.dueNext7Days, hasLength(7));

      await practice.unenroll('chk_table_for');
      expect(await practice.enrolledChunkIds(), hasLength(2));
      await practice.resetProgress();
      expect(await practice.enrolledChunkIds(), isEmpty);
      expect(await practice.listHistory(), isEmpty);
      expect((await practice.planStats(now)).total, 0);
    });

    test('streak counts consecutive local days ending today or yesterday', () {
      final today = DateTime(2026, 9, 20, 15);
      DateTime day(int offset) => DateTime(2026, 9, 20 - offset);
      expect(SqlitePracticeRepository.streakLength(<DateTime>{}, today), 0);
      expect(SqlitePracticeRepository.streakLength(<DateTime>{day(0)}, today), 1);
      expect(SqlitePracticeRepository.streakLength(<DateTime>{day(1), day(2)}, today), 2);
      expect(SqlitePracticeRepository.streakLength(<DateTime>{day(0), day(1), day(3)}, today), 2);
      expect(SqlitePracticeRepository.streakLength(<DateTime>{day(2)}, today), 0);
    });

    test('session use case respects the daily new limit and prefers reviews', () async {
      final now = clock.now();
      final chunkIds = bundle.chunks.take(6).map((c) => c.id).toList();
      await practice.enroll(chunkIds, now);
      final useCase = StartPracticeSessionUseCase(
        content: content,
        practice: practice,
        clock: clock,
      );
      final limited = await useCase(const LearnerSettings(dailyNewLimit: 2, sessionSize: 20));
      expect(limited, hasLength(2));
      expect(limited.every((e) => e.chunk.id == e.state.chunkId), isTrue);

      final capped = await useCase(const LearnerSettings(dailyNewLimit: 10, sessionSize: 4));
      expect(capped, hasLength(4));

      final none = await useCase(const LearnerSettings(dailyNewLimit: 0));
      expect(none, isEmpty);
      final ahead = await useCase(const LearnerSettings(dailyNewLimit: 0), practiceAhead: true);
      expect(ahead, isEmpty, reason: 'new chunks are due, not upcoming');
    });
  });

  group('ExportAnkiUseCase on SQLite', () {
    test('exports enrolled chunks or the whole library', () async {
      final useCase = ExportAnkiUseCase(content: content, practice: practice);
      final empty = await useCase();
      expect(empty.noteCount, 0);
      expect(empty.content, startsWith('#separator:tab'));

      await practice.enroll(<String>['chk_tell_me_more'], clock.now());
      final enrolled = await useCase();
      expect(enrolled.noteCount, 1);
      expect(enrolled.content, contains('Could you tell me more about your research?'));
      expect(enrolled.content, contains('opensen::meeting_a_professor'));

      final all = await useCase(enrolledOnly: false);
      expect(all.noteCount, bundle.chunks.length);
    });
  });

  group('SqliteSettingsRepository', () {
    test('round-trips settings through the meta table', () async {
      final repo = SqliteSettingsRepository(db);
      expect((await repo.load()).onboardingComplete, isFalse);
      await repo.save(
        const LearnerSettings(
          goal: 'travel',
          dailyNewLimit: 7,
          desiredRetention: 0.85,
          themeMode: AppThemeMode.dark,
          onboardingComplete: true,
          ttsEnabled: false,
          speechRate: 0.6,
        ),
      );
      final loaded = await repo.load();
      expect(loaded.goal, 'travel');
      expect(loaded.dailyNewLimit, 7);
      expect(loaded.desiredRetention, 0.85);
      expect(loaded.themeMode, AppThemeMode.dark);
      expect(loaded.onboardingComplete, isTrue);
      expect(loaded.ttsEnabled, isFalse);
      expect(loaded.speechRate, 0.6);
      expect(await SeedImporter(db).currentVersion(), bundle.version,
          reason: 'settings rows do not clobber the seed version');
    });
  });

  test('chunk type round-trips', () async {
    final chunk = Chunk(
      id: 'c1',
      text: 'Just a phrase',
      type: ChunkType.phrase,
      meaning: 'm',
      level: 'A1',
      register: Register.casual,
      isTemplate: false,
      createdAt: clock.now(),
    );
    await content.saveChunk(chunk);
    final loaded = await content.getChunk('c1');
    expect(loaded!.type, ChunkType.phrase);
    expect(loaded.register, Register.casual);
    expect(loaded.createdAt, clock.now());
  });
}
