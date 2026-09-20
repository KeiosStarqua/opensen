import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/services/slot_template.dart';

void main() {
  const template = 'Could you tell me more about {topic}?';

  test('finds slot names in order without duplicates', () {
    expect(SlotTemplate.slotNames(template), <String>['topic']);
    expect(
      SlotTemplate.slotNames('I have {years} years in {field}, {years} total.'),
      <String>['years', 'field'],
    );
    expect(SlotTemplate.hasSlots('No slots here.'), isFalse);
  });

  test('renders fills and falls back for unknown slots', () {
    expect(
      SlotTemplate.render(template, <String, String>{'topic': 'the program'}),
      'Could you tell me more about the program?',
    );
    expect(
      SlotTemplate.render(template, <String, String>{}),
      'Could you tell me more about [topic]?',
    );
    expect(
      SlotTemplate.render(template, <String, String>{}, fallback: (s) => '…'),
      'Could you tell me more about …?',
    );
  });

  test('blanks one slot while filling the others', () {
    const twoSlots = 'I have {years} years of experience in {field}.';
    expect(
      SlotTemplate.blank(
        twoSlots,
        'field',
        fills: <String, String>{'years': 'three'},
      ),
      'I have three years of experience in _____.',
    );
    expect(SlotTemplate.blankAll(twoSlots), 'I have _____ years of experience in _____.');
  });

  test('extracts fills back out of a rendered sentence', () {
    expect(
      SlotTemplate.extractFills(template, 'Could you tell me more about your research?'),
      <String, String>{'topic': 'your research'},
    );
    expect(
      SlotTemplate.extractFills(
        'I have {years} years of experience in {field}.',
        'I have over ten years of experience in digital marketing.',
      ),
      <String, String>{'years': 'over ten', 'field': 'digital marketing'},
    );
    expect(SlotTemplate.extractFills(template, 'Something else entirely.'), isNull);
    expect(SlotTemplate.extractFills('Fixed.', 'Fixed.'), <String, String>{});
  });
}
