import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/dialogue.dart';
import 'package:opensen/domain/entities/situation.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();

  test('bundled seed content follows the authoring rules', () {
    expect(bundle.validate(), isEmpty);
  });

  test('covers every situation category with a dialogue', () {
    final categories = bundle.situations.map((s) => s.category).toSet();
    expect(categories, containsAll(SituationCategory.values));
    for (final situation in bundle.situations) {
      final dialogues = bundle.dialogues.where((d) => d.situationId == situation.id);
      expect(dialogues, isNotEmpty, reason: '${situation.id} needs a dialogue');
      expect(situation.prompts, isNotEmpty, reason: '${situation.id} needs prompts');
    }
  });

  test('every situation exposes at least three drillable frames', () {
    for (final situation in bundle.situations) {
      final frames = bundle.patterns.where(
        (p) => p.situationIds.contains(situation.id) &&
            p.slots.any((s) => s.validatedVariants.length >= 2),
      );
      expect(frames.length, greaterThanOrEqualTo(3), reason: situation.id);
    }
  });

  test('self lines carry chunks and template chunks carry slot fills', () {
    for (final dialogue in bundle.dialogues) {
      final selfLines = dialogue.lines.where((l) => l.speaker == Speaker.self);
      expect(selfLines.where((l) => l.chunkIds.isNotEmpty).length, greaterThanOrEqualTo(4));
    }
    for (final chunk in bundle.chunks.where((c) => c.patternId != null)) {
      expect(chunk.slotFills, isNotEmpty, reason: chunk.id);
    }
    expect(bundle.chunks.map((c) => c.id).toSet(), hasLength(bundle.chunks.length));
    expect(bundle.patterns.map((p) => p.id).toSet(), hasLength(bundle.patterns.length));
  });

  test('derives deterministic slot and variant ids', () {
    final pattern = bundle.patterns.singleWhere((p) => p.id == 'pat_tell_me_more');
    expect(pattern.slots.single.id, 'pat_tell_me_more__topic');
    expect(pattern.slots.single.variants.first.id, 'pat_tell_me_more__topic__0');
    expect(pattern.intentNames, contains('ask_for_information'));
  });
}
