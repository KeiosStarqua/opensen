import 'dart:math';

import '../entities/sentence_pattern.dart';
import 'slot_template.dart';

/// One substitution-drill step: two worked variants, then the blanked frame.
class DrillItem {
  const DrillItem({
    required this.patternId,
    required this.slotId,
    required this.slotName,
    required this.prompt,
    required this.examples,
    required this.answer,
    required this.fullSentence,
    required this.options,
    this.cue,
  });

  final String patternId;
  final String slotId;
  final String slotName;

  /// Frame with the target slot blanked, other slots filled.
  final String prompt;

  /// Rendered sentences showing the frame with other fills.
  final List<String> examples;

  /// The variant text the learner should produce.
  final String answer;

  /// The frame rendered with [answer].
  final String fullSentence;

  /// Shuffled choices for the recognition step (includes [answer]).
  final List<String> options;

  /// Gloss of the answer variant, shown as a production cue.
  final String? cue;
}

/// Builds Substitution Drill items from a pattern's validated variants.
class DrillGenerator {
  const DrillGenerator();

  /// Items for every slot with at least two validated variants. Order is
  /// shuffled with [random] so the same pattern drills differently each time.
  List<DrillItem> forPattern(
    SentencePattern pattern, {
    Random? random,
    int maxItemsPerSlot = 4,
    int optionCount = 4,
  }) {
    final rng = random ?? Random();
    final items = <DrillItem>[];
    for (final slot in pattern.slots) {
      final variants = slot.validatedVariants;
      if (variants.length < 2) continue;
      final targets = List<SlotVariant>.from(variants)..shuffle(rng);
      for (final target in targets.take(maxItemsPerSlot)) {
        final others = variants.where((v) => v.id != target.id).toList();
        final examples = others
            .take(2)
            .map((variant) => _render(pattern, slot, variant.text))
            .toList();
        final distractors = others.map((v) => v.text).toList()..shuffle(rng);
        final options = <String>[
          target.text,
          ...distractors.take(optionCount - 1),
        ]..shuffle(rng);
        items.add(
          DrillItem(
            patternId: pattern.id,
            slotId: slot.id,
            slotName: slot.name,
            prompt: SlotTemplate.blank(
              pattern.template,
              slot.name,
              fills: pattern.defaultFills,
            ),
            examples: examples,
            answer: target.text,
            fullSentence: _render(pattern, slot, target.text),
            options: options,
            cue: target.meaning,
          ),
        );
      }
    }
    return items;
  }

  /// Whether [answer] is one of the slot's known variants (case-insensitive,
  /// ignoring surrounding punctuation).
  static SlotVariant? matchVariant(PatternSlot slot, String answer) {
    final wanted = _fold(answer);
    if (wanted.isEmpty) return null;
    for (final variant in slot.variants) {
      if (_fold(variant.text) == wanted) return variant;
    }
    return null;
  }

  static String _fold(String text) =>
      text.toLowerCase().replaceAll(RegExp(r'^[\s\p{P}]+|[\s\p{P}]+$', unicode: true), '');

  static String _render(SentencePattern pattern, PatternSlot slot, String fill) =>
      pattern.render(<String, String>{slot.name: fill});
}
