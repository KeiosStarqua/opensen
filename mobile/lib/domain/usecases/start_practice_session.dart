import '../entities/chunk.dart';
import '../entities/learner_settings.dart';
import '../entities/practice.dart';
import '../entities/sentence_pattern.dart';
import '../repositories/content_repository.dart';
import '../repositories/practice_repository.dart';
import '../services/clock.dart';
import '../services/practice_session.dart';

/// Assembles the entries for one Recall Practice session: due reviews first,
/// then new chunks up to the remaining daily allowance.
class StartPracticeSessionUseCase {
  const StartPracticeSessionUseCase({
    required this.content,
    required this.practice,
    required this.clock,
  });

  final ContentRepository content;
  final PracticeRepository practice;
  final Clock clock;

  /// With [practiceAhead], an empty due queue falls back to the chunks whose
  /// reviews are coming up soonest (no daily-new limit applies to them).
  Future<List<PracticeEntry>> call(
    LearnerSettings settings, {
    bool practiceAhead = false,
  }) async {
    final now = clock.now();
    final due = await practice.listDue(now, limit: settings.sessionSize * 2);

    final introducedToday = await practice.countNewIntroducedSince(
      DayBoundary.startOfLocalDay(now),
    );
    var newAllowance = settings.dailyNewLimit - introducedToday;
    if (newAllowance < 0) newAllowance = 0;

    final selected = <UserChunkState>[];
    for (final state in due) {
      if (selected.length >= settings.sessionSize) break;
      if (state.status == ChunkStatus.fresh) {
        if (newAllowance == 0) continue;
        newAllowance--;
      }
      selected.add(state);
    }
    if (selected.isEmpty && practiceAhead) {
      selected.addAll(
        await practice.listUpcoming(now, limit: settings.sessionSize),
      );
    }
    if (selected.isEmpty) return const <PracticeEntry>[];

    final chunks = await content.listChunks(
      ids: selected.map((s) => s.chunkId).toSet(),
    );
    final chunksById = <String, Chunk>{for (final c in chunks) c.id: c};
    final patternIds = <String>{
      for (final chunk in chunks)
        if (chunk.patternId != null) chunk.patternId!,
    };
    final patterns = patternIds.isEmpty
        ? const <SentencePattern>[]
        : await content.listPatterns(ids: patternIds);
    final patternsById = <String, SentencePattern>{
      for (final p in patterns) p.id: p,
    };

    return <PracticeEntry>[
      for (final state in selected)
        if (chunksById[state.chunkId] != null)
          PracticeEntry(
            chunk: chunksById[state.chunkId]!,
            state: state,
            pattern: chunksById[state.chunkId]!.patternId == null
                ? null
                : patternsById[chunksById[state.chunkId]!.patternId!],
          ),
    ];
  }
}
