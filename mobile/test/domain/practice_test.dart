import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/practice.dart';
import 'package:opensen/domain/services/answer_matcher.dart';
import 'package:opensen/domain/services/practice_item_factory.dart';
import 'package:opensen/domain/services/practice_session.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();
  final now = DateTime.utc(2026, 9, 20, 9);
  final chunk = bundle.chunks.singleWhere((c) => c.id == 'chk_tell_me_more');
  final pattern = bundle.patterns.singleWhere((p) => p.id == chunk.patternId);
  final fixedChunk = bundle.chunks.singleWhere((c) => c.id == 'chk_rs_recommend');
  const factory = PracticeItemFactory();

  group('PracticeItemFactory', () {
    test('first exposure listens and repeats when speech is available', () {
      final fresh = UserChunkState.initial(chunk.id, now);
      expect(
        factory.chooseMode(fresh, hasSwappableSlot: true, canSpeak: true),
        PracticeMode.listenRepeat,
      );
      expect(
        factory.chooseMode(fresh, hasSwappableSlot: true, canSpeak: false),
        PracticeMode.l1ToL2,
      );
    });

    test('later repetitions rotate through production modes', () {
      final modes = <PracticeMode>{};
      for (var reps = 1; reps <= 4; reps++) {
        final state = UserChunkState.initial(chunk.id, now).copyWith(reps: reps);
        modes.add(factory.chooseMode(state, hasSwappableSlot: true, canSpeak: false));
      }
      expect(modes, containsAll(<PracticeMode>[PracticeMode.l1ToL2, PracticeMode.cloze, PracticeMode.slotSwap]));
      final noSlot = UserChunkState.initial(chunk.id, now).copyWith(reps: 3);
      expect(
        factory.chooseMode(noSlot, hasSwappableSlot: false, canSpeak: false),
        isNot(PracticeMode.slotSwap),
      );
    });

    test('cloze blanks the slot when the chunk has a pattern', () {
      final item = factory.build(chunk: chunk, mode: PracticeMode.cloze, pattern: pattern);
      expect(item.prompt, 'Could you tell me more about _____?');
      expect(item.expected, chunk.text);
      expect(item.slotName, 'topic');
      expect(item.hint, contains('Missing'));
    });

    test('cloze blanks the longest word for a chunk without a pattern', () {
      final item = factory.build(chunk: fixedChunk, mode: PracticeMode.cloze);
      expect(item.prompt, 'What would you _____');
      expect(item.expected, fixedChunk.text);
      expect(item.hint, contains('"r"'));
    });

    test('slot swap asks for a different variant and expects the re-rendered frame', () {
      final item = factory.build(
        chunk: chunk,
        mode: PracticeMode.slotSwap,
        pattern: pattern,
        random: Random(1),
      );
      expect(item.mode, PracticeMode.slotSwap);
      expect(item.expected, isNot(chunk.text));
      expect(item.expected, startsWith('Could you tell me more about '));
      expect(item.prompt, contains(chunk.text));
      final swapped = item.expected
          .replaceFirst('Could you tell me more about ', '')
          .replaceFirst('?', '');
      expect(pattern.slots.single.variants.map((v) => v.text), contains(swapped));
    });

    test('slot swap without a pattern falls back to cloze', () {
      final item = factory.build(chunk: fixedChunk, mode: PracticeMode.slotSwap);
      expect(item.mode, PracticeMode.cloze);
    });

    test('listen-and-repeat carries the spoken text', () {
      final item = factory.build(chunk: chunk, mode: PracticeMode.listenRepeat);
      expect(item.spokenText, chunk.text);
      expect(item.prompt, chunk.meaning);
    });
  });

  group('PracticeSession', () {
    PracticeEntry entry(String id, {int reps = 0}) => PracticeEntry(
          chunk: chunk.copyWith(text: '$id ${chunk.text}'),
          state: UserChunkState.initial(id, now).copyWith(reps: reps),
          pattern: pattern,
        );

    test('walks the queue and re-queues chunks due within the learn-ahead window', () {
      final session = PracticeSession(
        entries: <PracticeEntry>[entry('a'), entry('b')],
        canSpeak: false,
        random: Random(1),
      );
      expect(session.initialCount, 2);
      expect(session.current!.state.chunkId, 'a');
      expect(session.currentItem, isNotNull);
      expect(session.progress, 0);

      final soon = session.current!.state.copyWith(
        nextReview: now.add(const Duration(minutes: 1)),
        reps: 1,
      );
      final requeued = session.complete(ReviewRating.forgot, soon, now);
      expect(requeued, isTrue);
      expect(session.remaining, 2);
      expect(session.current!.state.chunkId, 'b');
      expect(session.completed, 1);
      expect(session.ratings[ReviewRating.forgot], 1);

      final far = session.current!.state.copyWith(
        nextReview: now.add(const Duration(days: 3)),
        reps: 1,
      );
      expect(session.complete(ReviewRating.good, far, now), isFalse);
      expect(session.current!.state.chunkId, 'a');
      expect(session.current!.appearances, 2);
      expect(session.currentItem!.mode, isNot(PracticeMode.listenRepeat));

      session.skip();
      expect(session.isFinished, isTrue);
      expect(session.currentItem, isNull);
      expect(session.progress, 1);
    });

    test('stops re-queuing after the maximum number of appearances', () {
      final session = PracticeSession(
        entries: <PracticeEntry>[entry('a')],
        canSpeak: false,
        maxAppearances: 2,
      );
      final soon = session.current!.state.copyWith(nextReview: now.add(const Duration(seconds: 30)));
      expect(session.complete(ReviewRating.forgot, soon, now), isTrue);
      expect(session.complete(ReviewRating.forgot, soon, now), isFalse);
      expect(session.isFinished, isTrue);
    });
  });

  group('AnswerMatcher', () {
    test('normalises case, punctuation and spacing', () {
      expect(AnswerMatcher.normalize("  Could you  TELL me more, about it?! "), 'could you tell me more about it');
    });

    test('scores exact, near and wrong answers', () {
      expect(AnswerMatcher.similarity(chunk.text, chunk.text), 1);
      final near = AnswerMatcher.similarity(chunk.text, 'Could you tell me more about you research');
      expect(near, greaterThan(AnswerMatcher.correctThreshold));
      expect(AnswerMatcher.isCorrect(near), isTrue);
      final wrong = AnswerMatcher.similarity(chunk.text, 'Where is the station?');
      expect(wrong, lessThan(0.5));
      expect(AnswerMatcher.similarity('', ''), 1);
      expect(AnswerMatcher.similarity('a', ''), 0);
    });

    test('levenshtein distance', () {
      expect(AnswerMatcher.levenshtein('kitten', 'sitting'), 3);
      expect(AnswerMatcher.levenshtein('', 'abc'), 3);
      expect(AnswerMatcher.levenshtein('same', 'same'), 0);
    });
  });
}
