import 'register.dart';

enum ChunkType {
  sentence('sentence', 'Full sentence'),
  phrase('phrase', 'Phrase'),
  routine('routine', 'Routine');

  const ChunkType(this.key, this.label);

  final String key;
  final String label;

  static ChunkType fromKey(String? key) => ChunkType.values.firstWhere(
        (type) => type.key == key,
        orElse: () => ChunkType.sentence,
      );
}

/// The memorisation unit: a concrete, speakable surface form that optionally
/// instantiates a [SentencePattern] with specific slot fills.
class Chunk {
  const Chunk({
    required this.id,
    required this.text,
    required this.type,
    required this.meaning,
    required this.level,
    required this.register,
    required this.isTemplate,
    required this.createdAt,
    this.pronunciation,
    this.patternId,
    this.situationId,
    this.sourceTemplateId,
    this.slotFills = const <String, String>{},
  });

  final String id;
  final String text;
  final ChunkType type;

  /// Plain-language gloss shown as the L1 → L2 prompt. Learners may edit it.
  final String meaning;
  final String? pronunciation;
  final String? patternId;
  final String level;
  final Register register;
  final String? situationId;
  final bool isTemplate;
  final String? sourceTemplateId;

  /// Slot name → fill used to render this chunk from its pattern. Empty when
  /// the chunk has no pattern.
  final Map<String, String> slotFills;
  final DateTime createdAt;

  bool get hasPattern => patternId != null;

  Chunk copyWith({
    String? text,
    ChunkType? type,
    String? meaning,
    String? pronunciation,
    String? patternId,
    String? level,
    Register? register,
    String? situationId,
    bool? isTemplate,
    String? sourceTemplateId,
    Map<String, String>? slotFills,
  }) {
    return Chunk(
      id: id,
      text: text ?? this.text,
      type: type ?? this.type,
      meaning: meaning ?? this.meaning,
      pronunciation: pronunciation ?? this.pronunciation,
      patternId: patternId ?? this.patternId,
      level: level ?? this.level,
      register: register ?? this.register,
      situationId: situationId ?? this.situationId,
      isTemplate: isTemplate ?? this.isTemplate,
      sourceTemplateId: sourceTemplateId ?? this.sourceTemplateId,
      slotFills: slotFills ?? this.slotFills,
      createdAt: createdAt,
    );
  }
}
