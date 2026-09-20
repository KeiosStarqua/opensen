import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/entities/situation.dart';

/// Library search. An empty query lists everything.
final chunkSearchProvider = FutureProvider.family<List<Chunk>, String>(
  (ref, query) => ref
      .watch(contentRepositoryProvider)
      .listChunks(query: query.trim().isEmpty ? null : query.trim()),
);

/// Practice states for the whole library, keyed by chunk id.
final libraryStatesProvider = FutureProvider<Map<String, UserChunkState>>(
  (ref) async {
    final practice = ref.watch(practiceRepositoryProvider);
    final ids = await practice.enrolledChunkIds();
    return practice.getStates(ids);
  },
);

class ChunkDetail {
  const ChunkDetail({
    required this.chunk,
    this.pattern,
    this.situation,
    this.state,
    this.siblings = const <Chunk>[],
  });

  final Chunk chunk;
  final SentencePattern? pattern;
  final Situation? situation;
  final UserChunkState? state;

  /// Other chunks built from the same pattern.
  final List<Chunk> siblings;

  bool get isEnrolled => state != null;
}

final chunkDetailProvider = FutureProvider.family<ChunkDetail?, String>(
  (ref, chunkId) async {
    final content = ref.watch(contentRepositoryProvider);
    final practice = ref.watch(practiceRepositoryProvider);
    final chunk = await content.getChunk(chunkId);
    if (chunk == null) return null;
    final pattern =
        chunk.patternId == null ? null : await content.getPattern(chunk.patternId!);
    final situation = chunk.situationId == null
        ? null
        : await content.getSituation(chunk.situationId!);
    final state = await practice.getState(chunkId);
    final siblings = pattern == null
        ? const <Chunk>[]
        : (await content.listChunks(patternId: pattern.id))
            .where((c) => c.id != chunk.id)
            .toList();
    return ChunkDetail(
      chunk: chunk,
      pattern: pattern,
      situation: situation,
      state: state,
      siblings: siblings,
    );
  },
);

/// Invalidate everything that shows chunk or practice state.
void invalidateChunkViews(WidgetRef ref) {
  ref.invalidate(chunkSearchProvider);
  ref.invalidate(libraryStatesProvider);
  ref.invalidate(chunkDetailProvider);
}
