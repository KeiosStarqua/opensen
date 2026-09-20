import '../entities/chunk.dart';
import '../entities/sentence_pattern.dart';
import '../entities/situation.dart';
import '../repositories/content_repository.dart';
import '../repositories/practice_repository.dart';
import '../services/anki_deck_formatter.dart';

class AnkiExport {
  const AnkiExport({required this.content, required this.noteCount});

  final String content;
  final int noteCount;
}

/// Builds the Anki import file for the learner's chunks.
class ExportAnkiUseCase {
  const ExportAnkiUseCase({
    required this.content,
    required this.practice,
    this.formatter = const AnkiDeckFormatter(),
  });

  final ContentRepository content;
  final PracticeRepository practice;
  final AnkiDeckFormatter formatter;

  /// [enrolledOnly] limits the deck to chunks in the practice plan.
  Future<AnkiExport> call({bool enrolledOnly = true}) async {
    List<Chunk> chunks;
    if (enrolledOnly) {
      final ids = await practice.enrolledChunkIds();
      chunks = ids.isEmpty ? <Chunk>[] : await content.listChunks(ids: ids);
    } else {
      chunks = await content.listChunks();
    }
    if (chunks.isEmpty) {
      return AnkiExport(content: formatter.format(const <AnkiNote>[]), noteCount: 0);
    }

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
    final situations = await content.listSituations();
    final situationsById = <String, Situation>{
      for (final s in situations) s.id: s,
    };

    final notes = <AnkiNote>[
      for (final chunk in chunks)
        formatter.noteForChunk(
          chunk,
          pattern:
              chunk.patternId == null ? null : patternsById[chunk.patternId!],
          situation: chunk.situationId == null
              ? null
              : situationsById[chunk.situationId!],
        ),
    ];
    return AnkiExport(content: formatter.format(notes), noteCount: notes.length);
  }
}
