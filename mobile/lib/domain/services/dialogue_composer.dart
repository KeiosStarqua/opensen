import '../entities/chunk.dart';
import '../entities/dialogue.dart';
import '../entities/register.dart';
import '../entities/sentence_pattern.dart';
import '../entities/situation.dart';
import 'id_generator.dart';
import 'slot_template.dart';

/// What the learner typed into the Dialog Builder.
class DialogueRequest {
  const DialogueRequest({
    required this.templateSituationId,
    required this.roleSelf,
    required this.roleOther,
    required this.goal,
    required this.tone,
    required this.level,
    this.title,
    this.fills = const <String, String>{},
  });

  final String templateSituationId;
  final String roleSelf;
  final String roleOther;
  final String goal;
  final Register tone;
  final String level;
  final String? title;

  /// Slot name → the learner's own fill (blank values are ignored).
  final Map<String, String> fills;
}

/// A personalised dialogue ready to persist: the situation instance, the
/// rendered dialogue and any chunk instances that did not exist before.
class ComposedDialogue {
  const ComposedDialogue({
    required this.situation,
    required this.dialogue,
    required this.newChunks,
  });

  final Situation situation;
  final Dialogue dialogue;
  final List<Chunk> newChunks;

  /// Every chunk the dialogue uses (template chunks and new instances).
  List<String> get chunkIds => dialogue.chunkIds;
}

/// Offline Dialog Builder: turns a situation template plus the learner's slot
/// fills into a personal dialogue and the chunk instances it speaks.
///
/// Rules:
/// - Slots in a line are filled from the request, else from the first
///   variant of the slot on the pattern behind the line's chunk.
/// - A chunk instance is created only when the rendered text differs from
///   the template chunk; identical text reuses the template chunk (or an
///   existing chunk found through [findExistingChunk]).
class DialogueComposer {
  const DialogueComposer();

  ComposedDialogue compose({
    required Situation template,
    required Dialogue templateDialogue,
    required Map<String, Chunk> chunksById,
    required Map<String, SentencePattern> patternsById,
    required DialogueRequest request,
    required IdGenerator ids,
    required DateTime now,
    Chunk? Function(String text)? findExistingChunk,
  }) {
    final requestFills = <String, String>{
      for (final entry in request.fills.entries)
        if (entry.value.trim().isNotEmpty) entry.key: entry.value.trim(),
    };
    final title = (request.title ?? '').trim().isEmpty
        ? '${template.name} · my version'
        : request.title!.trim();

    final situationId = ids.next();
    final situation = Situation(
      id: situationId,
      name: title,
      description: template.description,
      category: template.category,
      roleSelf: request.roleSelf.trim().isEmpty
          ? template.roleSelf
          : request.roleSelf.trim(),
      roleOther: request.roleOther.trim().isEmpty
          ? template.roleOther
          : request.roleOther.trim(),
      goal: request.goal.trim().isEmpty ? template.goal : request.goal.trim(),
      tone: request.tone,
      level: request.level,
      isTemplate: false,
      sourceTemplateId: template.id,
      prompts: template.prompts,
      createdAt: now,
    );

    final dialogueId = ids.next();
    final newChunks = <Chunk>[];
    final newChunkByText = <String, Chunk>{};
    final lines = <DialogueLine>[];

    for (final line in templateDialogue.lines) {
      final lineFills = Map<String, String>.from(requestFills);
      for (final chunkId in line.chunkIds) {
        final pattern = _patternFor(chunksById[chunkId], patternsById);
        if (pattern == null) continue;
        for (final slot in pattern.slots) {
          final fallback = slot.defaultFill;
          if (fallback != null) lineFills.putIfAbsent(slot.name, () => fallback);
        }
      }
      final text = SlotTemplate.render(line.text, lineFills);

      final chunkIds = <String>[];
      for (final chunkId in line.chunkIds) {
        final templateChunk = chunksById[chunkId];
        if (templateChunk == null) continue;
        final pattern = _patternFor(templateChunk, patternsById);
        if (pattern == null || !pattern.hasSlots) {
          chunkIds.add(templateChunk.id);
          continue;
        }
        final chunkFills = <String, String>{
          for (final slot in pattern.slots)
            slot.name: lineFills[slot.name] ?? slot.defaultFill ?? '',
        };
        final rendered = SlotTemplate.render(pattern.template, chunkFills);
        if (rendered == templateChunk.text) {
          chunkIds.add(templateChunk.id);
          continue;
        }
        final existing =
            newChunkByText[rendered] ?? findExistingChunk?.call(rendered);
        if (existing != null) {
          chunkIds.add(existing.id);
          continue;
        }
        final instance = Chunk(
          id: ids.next(),
          text: rendered,
          type: templateChunk.type,
          meaning: templateChunk.meaning,
          patternId: pattern.id,
          level: templateChunk.level,
          register: templateChunk.register,
          situationId: situationId,
          isTemplate: false,
          sourceTemplateId: templateChunk.id,
          slotFills: chunkFills,
          createdAt: now,
        );
        newChunks.add(instance);
        newChunkByText[rendered] = instance;
        chunkIds.add(instance.id);
      }

      lines.add(
        DialogueLine(
          id: ids.next(),
          dialogueId: dialogueId,
          position: line.position,
          speaker: line.speaker,
          text: text,
          chunkIds: chunkIds,
        ),
      );
    }

    final dialogue = Dialogue(
      id: dialogueId,
      situationId: situationId,
      title: title,
      level: request.level,
      createdBy: 'learner',
      isTemplate: false,
      sourceTemplateId: templateDialogue.id,
      createdAt: now,
      lines: lines,
    );
    return ComposedDialogue(
      situation: situation,
      dialogue: dialogue,
      newChunks: newChunks,
    );
  }

  static SentencePattern? _patternFor(
    Chunk? chunk,
    Map<String, SentencePattern> patternsById,
  ) {
    final patternId = chunk?.patternId;
    return patternId == null ? null : patternsById[patternId];
  }
}
