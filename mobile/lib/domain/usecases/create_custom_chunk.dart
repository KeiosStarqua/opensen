import '../entities/chunk.dart';
import '../entities/register.dart';
import '../entities/sentence_pattern.dart';
import '../repositories/content_repository.dart';
import '../services/clock.dart';
import '../services/id_generator.dart';
import '../services/slot_template.dart';

class CustomChunkInput {
  const CustomChunkInput({
    required this.frame,
    required this.meaning,
    required this.register,
    required this.level,
    this.situationId,
    this.variantsBySlot = const <String, List<String>>{},
  });

  /// Sentence or frame. Slots are written as `{slot}`; each slot needs at
  /// least one variant in [variantsBySlot].
  final String frame;
  final String meaning;
  final Register register;
  final String level;
  final String? situationId;
  final Map<String, List<String>> variantsBySlot;
}

class CustomChunkException implements Exception {
  const CustomChunkException(this.message);

  final String message;

  @override
  String toString() => 'CustomChunkException: $message';
}

/// Lets the learner grow their own sentence graph: a plain sentence becomes a
/// chunk; a frame with `{slots}` also becomes a pattern with variants, and the
/// chunk is rendered from the first variant of each slot.
class CreateCustomChunkUseCase {
  const CreateCustomChunkUseCase({
    required this.content,
    required this.ids,
    required this.clock,
  });

  final ContentRepository content;
  final IdGenerator ids;
  final Clock clock;

  Future<Chunk> call(CustomChunkInput input) async {
    final frame = input.frame.trim();
    if (frame.isEmpty) throw const CustomChunkException('Write a sentence first');
    final now = clock.now();
    final slotNames = SlotTemplate.slotNames(frame);

    String? patternId;
    var text = frame;
    final fills = <String, String>{};
    if (slotNames.isNotEmpty) {
      patternId = ids.next();
      final slots = <PatternSlot>[];
      for (var position = 0; position < slotNames.length; position++) {
        final name = slotNames[position];
        final variants = (input.variantsBySlot[name] ?? const <String>[])
            .map((v) => v.trim())
            .where((v) => v.isNotEmpty)
            .toList();
        if (variants.isEmpty) {
          throw CustomChunkException('Add at least one fill for {$name}');
        }
        final slotId = ids.next();
        slots.add(
          PatternSlot(
            id: slotId,
            patternId: patternId,
            name: name,
            position: position,
            variants: <SlotVariant>[
              for (var i = 0; i < variants.length; i++)
                SlotVariant(
                  id: ids.next(),
                  slotId: slotId,
                  text: variants[i],
                  position: i,
                ),
            ],
          ),
        );
        fills[name] = variants.first;
      }
      final pattern = SentencePattern(
        id: patternId,
        template: frame,
        meaning: input.meaning.trim(),
        difficulty: 2,
        level: input.level,
        register: input.register,
        isTemplate: false,
        slots: slots,
        situationIds: <String>[
          if (input.situationId != null) input.situationId!,
        ],
      );
      await content.savePattern(pattern);
      text = SlotTemplate.render(frame, fills);
    }

    final existing = await content.findChunkByText(text);
    if (existing != null) {
      throw const CustomChunkException('This sentence is already in your library');
    }
    final chunk = Chunk(
      id: ids.next(),
      text: text,
      type: text.trim().endsWith('.') ||
              text.trim().endsWith('?') ||
              text.trim().endsWith('!')
          ? ChunkType.sentence
          : ChunkType.phrase,
      meaning: input.meaning.trim(),
      patternId: patternId,
      level: input.level,
      register: input.register,
      situationId: input.situationId,
      isTemplate: false,
      slotFills: fills,
      createdAt: now,
    );
    await content.saveChunk(chunk);
    return chunk;
  }
}
