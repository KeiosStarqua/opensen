import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/dialogue.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/entities/situation.dart';

final situationTemplatesProvider = FutureProvider<List<Situation>>(
  (ref) => ref.watch(contentRepositoryProvider).listSituations(templates: true),
);

/// Learner-built dialogues, newest first.
final myDialoguesProvider = FutureProvider<List<Dialogue>>(
  (ref) => ref.watch(contentRepositoryProvider).listDialogues(templates: false),
);

/// Chunk ids currently in the practice plan.
final enrolledChunkIdsProvider = FutureProvider<Set<String>>(
  (ref) => ref.watch(practiceRepositoryProvider).enrolledChunkIds(),
);

class SituationDetail {
  const SituationDetail({
    required this.situation,
    required this.patterns,
    required this.chunks,
    this.templateDialogue,
  });

  final Situation situation;
  final List<SentencePattern> patterns;
  final List<Chunk> chunks;
  final Dialogue? templateDialogue;
}

final situationDetailProvider = FutureProvider.family<SituationDetail?, String>(
  (ref, situationId) async {
    final content = ref.watch(contentRepositoryProvider);
    final situation = await content.getSituation(situationId);
    if (situation == null) return null;
    final templateId = situation.isTemplate
        ? situation.id
        : (situation.sourceTemplateId ?? situation.id);
    final patterns = await content.listPatterns(situationId: templateId);
    final chunks = await content.listChunks(situationId: situationId);
    final dialogues = await content.listDialogues(
      situationId: templateId,
      templates: true,
    );
    final templateDialogue =
        dialogues.isEmpty ? null : await content.getDialogue(dialogues.first.id);
    return SituationDetail(
      situation: situation,
      patterns: patterns,
      chunks: chunks,
      templateDialogue: templateDialogue,
    );
  },
);

class DialogueView {
  const DialogueView({
    required this.dialogue,
    required this.situation,
    required this.chunksById,
    required this.states,
  });

  final Dialogue dialogue;
  final Situation? situation;
  final Map<String, Chunk> chunksById;
  final Map<String, UserChunkState> states;

  List<Chunk> get chunks => <Chunk>[
        for (final id in dialogue.chunkIds)
          if (chunksById[id] != null) chunksById[id]!,
      ];

  List<Chunk> get unenrolledChunks =>
      chunks.where((chunk) => !states.containsKey(chunk.id)).toList();
}

final dialogueViewProvider = FutureProvider.family<DialogueView?, String>(
  (ref, dialogueId) async {
    final content = ref.watch(contentRepositoryProvider);
    final practice = ref.watch(practiceRepositoryProvider);
    final dialogue = await content.getDialogue(dialogueId);
    if (dialogue == null) return null;
    final situation = await content.getSituation(dialogue.situationId);
    final ids = dialogue.chunkIds.toSet();
    final chunks = ids.isEmpty ? const <Chunk>[] : await content.listChunks(ids: ids);
    final states = await practice.getStates(ids);
    return DialogueView(
      dialogue: dialogue,
      situation: situation,
      chunksById: <String, Chunk>{for (final c in chunks) c.id: c},
      states: states,
    );
  },
);
