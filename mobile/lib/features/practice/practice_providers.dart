import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/sentence_pattern.dart';

/// Practice Plan numbers for the dashboard and the practice tab badge.
final planStatsProvider = FutureProvider<PlanStats>(
  (ref) => ref
      .watch(practiceRepositoryProvider)
      .planStats(ref.watch(clockProvider).now()),
);

/// Frames behind the chunks in the plan, for the quick-drill list.
final drillablePatternsProvider = FutureProvider<List<SentencePattern>>(
  (ref) async {
    final content = ref.watch(contentRepositoryProvider);
    final practice = ref.watch(practiceRepositoryProvider);
    final ids = await practice.enrolledChunkIds();
    if (ids.isEmpty) return const <SentencePattern>[];
    final chunks = await content.listChunks(ids: ids);
    final patternIds = <String>{
      for (final chunk in chunks)
        if (chunk.patternId != null) chunk.patternId!,
    };
    if (patternIds.isEmpty) return const <SentencePattern>[];
    final patterns = await content.listPatterns(ids: patternIds);
    return patterns
        .where(
          (p) => p.slots.any((slot) => slot.validatedVariants.length > 1),
        )
        .toList();
  },
);

/// Recent review log for the plan screen.
final recentHistoryProvider = FutureProvider<List<ReviewRecord>>(
  (ref) => ref.watch(practiceRepositoryProvider).listHistory(limit: 30),
);

/// Last chunks the learner practised, most recent first (Today screen).
final recentChunksProvider = FutureProvider<List<Chunk>>((ref) async {
  final history = await ref.watch(recentHistoryProvider.future);
  final ids = <String>{for (final record in history) record.chunkId};
  if (ids.isEmpty) return const <Chunk>[];
  return ref
      .watch(contentRepositoryProvider)
      .listChunks(ids: ids.take(3).toSet());
});

void invalidatePracticeViews(WidgetRef ref) {
  ref.invalidate(planStatsProvider);
  ref.invalidate(drillablePatternsProvider);
  ref.invalidate(recentHistoryProvider);
  ref.invalidate(recentChunksProvider);
}
