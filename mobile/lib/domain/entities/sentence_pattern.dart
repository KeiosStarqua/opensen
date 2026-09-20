import '../services/slot_template.dart';
import 'register.dart';

/// A candidate fill for a slot; the source of substitution drills.
class SlotVariant {
  const SlotVariant({
    required this.id,
    required this.slotId,
    required this.text,
    this.meaning,
    this.level,
    this.isValidated = true,
    this.position = 0,
  });

  final String id;
  final String slotId;
  final String text;
  final String? meaning;
  final String? level;

  /// Whether the grammaticality gate passed. Learner-added variants start
  /// unvalidated and are excluded from drill answer keys.
  final bool isValidated;
  final int position;
}

/// A named substitution point inside a frame. Slots are rows, never
/// substrings parsed at runtime — this is what makes drills possible.
class PatternSlot {
  const PatternSlot({
    required this.id,
    required this.patternId,
    required this.name,
    required this.position,
    this.expectedPos,
    this.variants = const <SlotVariant>[],
  });

  final String id;
  final String patternId;
  final String name;
  final int position;
  final String? expectedPos;
  final List<SlotVariant> variants;

  List<SlotVariant> get validatedVariants =>
      variants.where((variant) => variant.isValidated).toList();

  /// The fill used by template chunks and unpersonalised dialogue lines.
  String? get defaultFill => variants.isEmpty ? null : variants.first.text;

  PatternSlot copyWith({List<SlotVariant>? variants}) => PatternSlot(
        id: id,
        patternId: patternId,
        name: name,
        position: position,
        expectedPos: expectedPos,
        variants: variants ?? this.variants,
      );
}

/// A reusable frame with named slots, e.g. `Could you tell me more about
/// {topic}?`. The unit between intent and chunk.
class SentencePattern {
  const SentencePattern({
    required this.id,
    required this.template,
    required this.meaning,
    required this.difficulty,
    required this.level,
    required this.register,
    required this.isTemplate,
    this.sourceTemplateId,
    this.slots = const <PatternSlot>[],
    this.intentNames = const <String>[],
    this.situationIds = const <String>[],
  });

  final String id;
  final String template;
  final String meaning;

  /// Relative difficulty 1–5.
  final int difficulty;
  final String level;
  final Register register;
  final bool isTemplate;
  final String? sourceTemplateId;
  final List<PatternSlot> slots;
  final List<String> intentNames;
  final List<String> situationIds;

  bool get hasSlots => slots.isNotEmpty;

  PatternSlot? slotNamed(String name) {
    for (final slot in slots) {
      if (slot.name == name) return slot;
    }
    return null;
  }

  /// Frame with every slot blanked, e.g. `Could you tell me more about _____?`
  String get frame => SlotTemplate.blankAll(template);

  /// Default fills: the first variant of every slot.
  Map<String, String> get defaultFills => <String, String>{
        for (final slot in slots)
          if (slot.defaultFill != null) slot.name: slot.defaultFill!,
      };

  /// Renders the frame with [fills], falling back to each slot's default.
  String render(Map<String, String> fills) => SlotTemplate.render(
        template,
        <String, String>{...defaultFills, ...fills},
      );

  SentencePattern copyWith({
    List<PatternSlot>? slots,
    List<String>? intentNames,
    List<String>? situationIds,
  }) {
    return SentencePattern(
      id: id,
      template: template,
      meaning: meaning,
      difficulty: difficulty,
      level: level,
      register: register,
      isTemplate: isTemplate,
      sourceTemplateId: sourceTemplateId,
      slots: slots ?? this.slots,
      intentNames: intentNames ?? this.intentNames,
      situationIds: situationIds ?? this.situationIds,
    );
  }
}
