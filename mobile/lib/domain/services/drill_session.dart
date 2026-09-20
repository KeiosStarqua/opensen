import 'dart:math';

import '../entities/sentence_pattern.dart';
import 'drill_generator.dart';

/// Whether a drill step asks the learner to recognise or to produce the fill.
enum DrillStep { choose, produce }

/// Outcome of answering a drill item.
enum DrillVerdict {
  /// Matched the target variant.
  correct,

  /// Matched another known variant of the slot — still a valid sentence.
  otherVariant,

  /// Not a known variant; the learner may keep it as a personal variant.
  unknown,
}

class DrillAnswer {
  const DrillAnswer({
    required this.item,
    required this.step,
    required this.answer,
    required this.verdict,
  });

  final DrillItem item;
  final DrillStep step;
  final String answer;
  final DrillVerdict verdict;

  bool get isAcceptable => verdict != DrillVerdict.unknown;
}

/// Substitution Drill flow for one pattern: every item is first recognised
/// (pick the fill), then produced (type or say a fill).
class DrillSession {
  DrillSession({
    required this.pattern,
    DrillGenerator generator = const DrillGenerator(),
    Random? random,
    int maxItemsPerSlot = 4,
  }) : items = generator.forPattern(
          pattern,
          random: random,
          maxItemsPerSlot: maxItemsPerSlot,
        );

  final SentencePattern pattern;
  final List<DrillItem> items;
  final List<DrillAnswer> answers = <DrillAnswer>[];

  int _index = 0;
  DrillStep _step = DrillStep.choose;

  bool get isEmpty => items.isEmpty;
  bool get isFinished => _index >= items.length;
  DrillItem? get current => isFinished ? null : items[_index];
  DrillStep get step => _step;
  int get position => _index;
  int get total => items.length;

  double get progress {
    if (items.isEmpty) return 1;
    return (_index + (_step == DrillStep.produce ? 0.5 : 0)) / items.length;
  }

  int get correctCount =>
      answers.where((a) => a.verdict == DrillVerdict.correct).length;

  /// Grades [answer] for the current step and advances.
  DrillAnswer? submit(String answer) {
    final item = current;
    if (item == null) return null;
    final slot = pattern.slotNamed(item.slotName);
    final matched = slot == null ? null : DrillGenerator.matchVariant(slot, answer);
    final DrillVerdict verdict;
    if (matched != null && _fold(matched.text) == _fold(item.answer)) {
      verdict = DrillVerdict.correct;
    } else if (matched != null) {
      verdict = DrillVerdict.otherVariant;
    } else {
      verdict = DrillVerdict.unknown;
    }
    final result = DrillAnswer(
      item: item,
      step: _step,
      answer: answer.trim(),
      verdict: verdict,
    );
    answers.add(result);
    if (_step == DrillStep.choose) {
      _step = DrillStep.produce;
    } else {
      _step = DrillStep.choose;
      _index++;
    }
    return result;
  }

  static String _fold(String text) => text.trim().toLowerCase();
}
