import '../entities/chunk.dart';
import '../entities/dialogue.dart';
import '../entities/sentence_pattern.dart';
import '../repositories/content_repository.dart';
import '../services/clock.dart';
import '../services/dialogue_composer.dart';
import '../services/id_generator.dart';

class DialogueBuildException implements Exception {
  const DialogueBuildException(this.message);

  final String message;

  @override
  String toString() => 'DialogueBuildException: $message';
}

/// Dialog Builder entry point: loads the template graph, composes the
/// personal dialogue, deduplicates chunk text against the library and saves.
class BuildDialogueUseCase {
  const BuildDialogueUseCase({
    required this.content,
    required this.ids,
    required this.clock,
    this.composer = const DialogueComposer(),
  });

  final ContentRepository content;
  final IdGenerator ids;
  final Clock clock;
  final DialogueComposer composer;

  Future<Dialogue> call(DialogueRequest request) async {
    final template = await content.getSituation(request.templateSituationId);
    if (template == null) {
      throw const DialogueBuildException('Situation template not found');
    }
    final templateDialogues = await content.listDialogues(
      situationId: template.id,
      templates: true,
    );
    if (templateDialogues.isEmpty) {
      throw const DialogueBuildException(
        'This situation has no dialogue template yet',
      );
    }
    final templateDialogue =
        await content.getDialogue(templateDialogues.first.id);
    if (templateDialogue == null) {
      throw const DialogueBuildException('Dialogue template not found');
    }

    final chunkIds = templateDialogue.chunkIds.toSet();
    final chunks = chunkIds.isEmpty
        ? const <Chunk>[]
        : await content.listChunks(ids: chunkIds);
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

    // Pre-resolve library duplicates so composition stays synchronous.
    final existingByText = <String, Chunk>{};
    for (final pattern in patterns) {
      final candidates = await content.listChunks(patternId: pattern.id);
      for (final candidate in candidates) {
        existingByText.putIfAbsent(candidate.text, () => candidate);
      }
    }

    final composed = composer.compose(
      template: template,
      templateDialogue: templateDialogue,
      chunksById: chunksById,
      patternsById: patternsById,
      request: request,
      ids: ids,
      now: clock.now(),
      findExistingChunk: (text) => existingByText[text],
    );
    await content.saveComposedDialogue(composed);
    return composed.dialogue;
  }
}
