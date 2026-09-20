import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/situation.dart';
import 'package:opensen/domain/services/anki_deck_formatter.dart';
import 'package:opensen/domain/services/situation_matcher.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();

  group('AnkiDeckFormatter', () {
    const formatter = AnkiDeckFormatter();
    final chunk = bundle.chunks.singleWhere((c) => c.id == 'chk_tell_me_more');
    final pattern = bundle.patterns.singleWhere((p) => p.id == chunk.patternId);
    final situation = bundle.situations.singleWhere((s) => s.id == chunk.situationId);

    test('writes Anki header directives and tab-separated rows', () {
      final note = formatter.noteForChunk(chunk, pattern: pattern, situation: situation);
      final output = formatter.format(<AnkiNote>[note]);
      final lines = output.trimRight().split('\n');
      expect(lines.take(4), <String>[
        '#separator:tab',
        '#html:true',
        '#tags column:3',
        '#columns:Front\tBack\tTags',
      ]);
      final row = lines[4].split('\t');
      expect(row, hasLength(3));
      expect(row[0], chunk.meaning);
      expect(row[1], contains('<b>${chunk.text}</b>'));
      expect(row[1], contains('Could you tell me more about _____?'));
      expect(row[1], contains('your research'));
      expect(row[2].split(' '), containsAll(<String>['opensen', 'opensen::meeting_a_professor', 'register::polite']));
    });

    test('escapes tabs and newlines and html-encodes text', () {
      final note = AnkiNote(front: 'a\tb\nc', back: '<x> & y', tags: const <String>['Two Words']);
      final output = formatter.format(<AnkiNote>[note]);
      final row = output.trimRight().split('\n').last.split('\t');
      expect(row[0], 'a b<br>c');
      expect(row[1], '<x> & y', reason: 'back is trusted HTML already built by the formatter');
      expect(row[2], 'two_words');
    });

    test('slugTag keeps hierarchy separators', () {
      expect(AnkiDeckFormatter.slugTag("At the doctor's"), 'at_the_doctor_s');
      expect(AnkiDeckFormatter.slugTag('opensen::Job interview'), 'opensen::job_interview');
    });
  });

  group('SituationMatcher', () {
    const matcher = SituationMatcher();

    test('ranks the professor situation first for a professor query', () {
      final ranked = matcher.rank(bundle.situations, 'Meeting my professor for the first time');
      expect(ranked.first.id, 'sit_professor');
    });

    test('uses synonyms and the preferred category', () {
      final ranked = matcher.rank(bundle.situations, 'I am sick and need to see someone');
      expect(ranked.map((s) => s.id), contains('sit_doctor'));

      final travel = matcher.rank(
        bundle.situations,
        'something',
        preferredCategory: SituationCategory.travel,
      );
      expect(travel.every((s) => s.category == SituationCategory.travel), isTrue);
    });

    test('returns nothing for an empty query without a category', () {
      expect(matcher.rank(bundle.situations, ''), isEmpty);
    });
  });
}
