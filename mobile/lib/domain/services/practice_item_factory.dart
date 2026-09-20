import 'dart:math';

import '../entities/chunk.dart';
import '../entities/practice.dart';
import '../entities/sentence_pattern.dart';
import 'slot_template.dart';

/// Turns a chunk into a concrete Recall Practice exercise.
class PracticeItemFactory {
  const PracticeItemFactory();

  /// Picks a mode that trains production and is possible for this chunk:
  /// first exposure listens and repeats, then the modes rotate with each
  /// repetition so a frame is recalled from meaning, rebuilt from a gap and
  /// finally re-slotted.
  PracticeMode chooseMode(
    UserChunkState state, {
    required bool hasSwappableSlot,
    required bool canSpeak,
  }) {
    if (state.reps == 0) {
      return canSpeak ? PracticeMode.listenRepeat : PracticeMode.l1ToL2;
    }
    final rotation = <PracticeMode>[
      PracticeMode.l1ToL2,
      PracticeMode.cloze,
      if (hasSwappableSlot) PracticeMode.slotSwap,
      if (canSpeak) PracticeMode.listenRepeat,
    ];
    return rotation[(state.reps - 1) % rotation.length];
  }

  PracticeItem build({
    required Chunk chunk,
    required PracticeMode mode,
    SentencePattern? pattern,
    Random? random,
  }) {
    switch (mode) {
      case PracticeMode.listenRepeat:
        return PracticeItem(
          chunkId: chunk.id,
          mode: mode,
          prompt: chunk.meaning,
          expected: chunk.text,
          spokenText: chunk.text,
          hint: _firstWords(chunk.text, 3),
        );
      case PracticeMode.l1ToL2:
        return PracticeItem(
          chunkId: chunk.id,
          mode: mode,
          prompt: chunk.meaning,
          expected: chunk.text,
          hint: _firstWords(chunk.text, 2),
        );
      case PracticeMode.cloze:
        return _cloze(chunk, pattern);
      case PracticeMode.slotSwap:
        return _slotSwap(chunk, pattern, random ?? Random()) ??
            build(chunk: chunk, mode: PracticeMode.cloze, pattern: pattern);
    }
  }

  PracticeItem _cloze(Chunk chunk, SentencePattern? pattern) {
    if (pattern != null && pattern.hasSlots) {
      final fills = chunk.slotFills.isNotEmpty
          ? chunk.slotFills
          : SlotTemplate.extractFills(pattern.template, chunk.text);
      final slot = pattern.slots.first;
      final fill = fills?[slot.name];
      if (fill != null && fill.isNotEmpty) {
        return PracticeItem(
          chunkId: chunk.id,
          mode: PracticeMode.cloze,
          prompt: SlotTemplate.blank(pattern.template, slot.name, fills: fills!),
          expected: chunk.text,
          hint: 'Missing: ${_firstWords(fill, 1)}…',
          slotName: slot.name,
        );
      }
    }
    // No slot data: blank the longest word so the frame still has a gap.
    final words = chunk.text.split(' ');
    var targetIndex = 0;
    for (var i = 0; i < words.length; i++) {
      if (_letters(words[i]).length > _letters(words[targetIndex]).length) {
        targetIndex = i;
      }
    }
    final targetLetters = _letters(words[targetIndex]);
    final blanked = List<String>.from(words)
      ..[targetIndex] = SlotTemplate.blankMarker;
    return PracticeItem(
      chunkId: chunk.id,
      mode: PracticeMode.cloze,
      prompt: blanked.join(' '),
      expected: chunk.text,
      hint: targetLetters.isEmpty
          ? null
          : 'Missing word starts with "${targetLetters.substring(0, 1)}"',
    );
  }

  PracticeItem? _slotSwap(Chunk chunk, SentencePattern? pattern, Random rng) {
    if (pattern == null || !pattern.hasSlots) return null;
    final fills = chunk.slotFills.isNotEmpty
        ? chunk.slotFills
        : SlotTemplate.extractFills(pattern.template, chunk.text) ??
            pattern.defaultFills;
    final candidates = <PatternSlot>[];
    for (final slot in pattern.slots) {
      final current = fills[slot.name];
      if (slot.validatedVariants.any((v) => v.text != current)) {
        candidates.add(slot);
      }
    }
    if (candidates.isEmpty) return null;
    final slot = candidates[rng.nextInt(candidates.length)];
    final current = fills[slot.name];
    final alternatives =
        slot.validatedVariants.where((v) => v.text != current).toList();
    final replacement = alternatives[rng.nextInt(alternatives.length)];
    final expected = pattern.render(<String, String>{
      ...fills,
      slot.name: replacement.text,
    });
    return PracticeItem(
      chunkId: chunk.id,
      mode: PracticeMode.slotSwap,
      prompt: '${chunk.text}\n→ now with “${replacement.text}”',
      expected: expected,
      hint: _firstWords(expected, 2),
      slotName: slot.name,
    );
  }

  static String _firstWords(String text, int count) {
    final words = text.split(' ');
    return '${words.take(count).join(' ')}…';
  }

  static String _letters(String word) =>
      word.replaceAll(RegExp(r'[^A-Za-z]'), '');
}
