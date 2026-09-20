import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/services/drill_generator.dart';
import 'package:opensen/domain/services/drill_session.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();
  final tellMeMore = bundle.patterns.singleWhere((p) => p.id == 'pat_tell_me_more');
  final twoSlots = bundle.patterns.singleWhere((p) => p.id == 'pat_years_experience');

  group('DrillGenerator', () {
    test('builds one item per target variant with a blanked prompt', () {
      final items = const DrillGenerator().forPattern(tellMeMore, random: Random(1));
      expect(items, hasLength(4));
      for (final item in items) {
        expect(item.prompt, 'Could you tell me more about _____?');
        expect(item.examples, hasLength(2));
        expect(item.examples, isNot(contains(item.fullSentence)));
        expect(item.options, contains(item.answer));
        expect(item.options.toSet(), hasLength(item.options.length));
        expect(item.fullSentence, 'Could you tell me more about ${item.answer}?');
      }
      expect(items.map((i) => i.answer).toSet(), hasLength(4));
    });

    test('drills each slot of a multi-slot frame with the other slot filled', () {
      final items = const DrillGenerator().forPattern(twoSlots, random: Random(2));
      final prompts = items.map((i) => i.prompt).toSet();
      expect(prompts, contains('I have _____ years of experience in software development.'));
      expect(prompts, contains('I have three years of experience in _____.'));
    });

    test('is deterministic for a seeded random', () {
      final a = const DrillGenerator().forPattern(tellMeMore, random: Random(7));
      final b = const DrillGenerator().forPattern(tellMeMore, random: Random(7));
      expect(a.map((i) => i.answer), b.map((i) => i.answer));
      expect(a.first.options, b.first.options);
    });

    test('matchVariant ignores case and surrounding punctuation', () {
      final slot = tellMeMore.slots.single;
      expect(DrillGenerator.matchVariant(slot, ' The Program. ')?.text, 'the program');
      expect(DrillGenerator.matchVariant(slot, 'your salary'), isNull);
    });
  });

  group('DrillSession', () {
    test('alternates choose then produce and grades each answer', () {
      final session = DrillSession(pattern: tellMeMore, random: Random(3), maxItemsPerSlot: 2);
      expect(session.total, 2);
      expect(session.isFinished, isFalse);
      expect(session.step, DrillStep.choose);

      final first = session.current!;
      final chosen = session.submit(first.answer)!;
      expect(chosen.verdict, DrillVerdict.correct);
      expect(session.step, DrillStep.produce);
      expect(session.position, 0);

      final other = tellMeMore.slots.single.variants.firstWhere((v) => v.text != first.answer);
      final produced = session.submit(other.text)!;
      expect(produced.verdict, DrillVerdict.otherVariant);
      expect(produced.isAcceptable, isTrue);
      expect(session.position, 1);
      expect(session.step, DrillStep.choose);

      final second = session.current!;
      session.submit('wrong');
      final unknown = session.submit('my grandmother')!;
      expect(unknown.verdict, DrillVerdict.unknown);
      expect(unknown.isAcceptable, isFalse);
      expect(unknown.item, second);
      expect(session.isFinished, isTrue);
      expect(session.current, isNull);
      expect(session.submit('late'), isNull);
      expect(session.answers, hasLength(4));
      expect(session.correctCount, 1);
      expect(session.progress, 1);
    });

    test('is empty for a frame without swappable slots', () {
      final fixed = bundle.patterns.first.copyWith(slots: const []);
      final session = DrillSession(pattern: fixed);
      expect(session.isEmpty, isTrue);
      expect(session.isFinished, isTrue);
    });
  });
}
