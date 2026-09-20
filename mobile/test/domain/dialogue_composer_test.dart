import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/chunk.dart';
import 'package:opensen/domain/entities/dialogue.dart';
import 'package:opensen/domain/entities/register.dart';
import 'package:opensen/domain/entities/sentence_pattern.dart';
import 'package:opensen/domain/services/dialogue_composer.dart';
import 'package:opensen/domain/services/id_generator.dart';

import '../helpers/fakes.dart';

void main() {
  final bundle = loadSeedBundle();
  final now = DateTime.utc(2026, 9, 20);
  final template = bundle.situations.singleWhere((s) => s.id == 'sit_professor');
  final templateDialogue = bundle.dialogues.singleWhere((d) => d.id == 'dlg_professor');
  final chunksById = <String, Chunk>{for (final c in bundle.chunks) c.id: c};
  final patternsById = <String, SentencePattern>{
    for (final p in bundle.patterns) p.id: p,
  };

  ComposedDialogue compose(DialogueRequest request, {Chunk? Function(String)? find}) =>
      const DialogueComposer().compose(
        template: template,
        templateDialogue: templateDialogue,
        chunksById: chunksById,
        patternsById: patternsById,
        request: request,
        ids: SequentialIdGenerator(prefix: 't'),
        now: now,
        findExistingChunk: find,
      );

  test('renders the learner fills into lines and creates chunk instances', () {
    final composed = compose(
      DialogueRequest(
        templateSituationId: template.id,
        roleSelf: 'Exchange student',
        roleOther: 'Dr. Lee',
        goal: 'Join the NLP lab',
        tone: Register.polite,
        level: 'B2',
        fills: const <String, String>{'interest': 'generative AI', 'topic': 'the lab'},
      ),
    );

    expect(composed.situation.isTemplate, isFalse);
    expect(composed.situation.sourceTemplateId, template.id);
    expect(composed.situation.roleSelf, 'Exchange student');
    expect(composed.dialogue.isTemplate, isFalse);
    expect(composed.dialogue.level, 'B2');
    expect(composed.dialogue.lines, hasLength(templateDialogue.lines.length));

    final firstSelfLine = composed.dialogue.lines.first;
    expect(firstSelfLine.speaker, Speaker.self);
    expect(firstSelfLine.text, contains("I'm particularly interested in generative AI."));
    expect(firstSelfLine.text, isNot(contains('{')));

    final texts = composed.newChunks.map((c) => c.text).toList();
    expect(texts, contains("I'm particularly interested in generative AI."));
    expect(texts, contains('Could you tell me more about the lab?'));
    for (final chunk in composed.newChunks) {
      expect(chunk.isTemplate, isFalse);
      expect(chunk.situationId, composed.situation.id);
      expect(chunk.sourceTemplateId, isNotNull);
      expect(chunk.slotFills, isNotEmpty);
    }
    expect(composed.newChunks.every((c) => composed.chunkIds.contains(c.id)), isTrue);
  });

  test('unfilled slots fall back to the default variant and reuse template chunks', () {
    final composed = compose(
      DialogueRequest(
        templateSituationId: template.id,
        roleSelf: '',
        roleOther: '',
        goal: '',
        tone: Register.polite,
        level: 'B1',
      ),
    );
    expect(composed.newChunks, isEmpty, reason: 'defaults equal template chunk text');
    expect(composed.situation.roleSelf, template.roleSelf);
    expect(composed.dialogue.chunkIds, containsAll(<String>['chk_interested_in', 'chk_tell_me_more']));
    for (final line in composed.dialogue.lines) {
      expect(line.text, isNot(contains('{')));
      expect(line.text, isNot(contains('[')));
    }
  });

  test('reuses an existing library chunk with the same text instead of duplicating', () {
    final existing = chunksById['chk_interested_in']!.copyWith(
      text: "I'm particularly interested in robots.",
    );
    final composed = compose(
      DialogueRequest(
        templateSituationId: template.id,
        roleSelf: 'Me',
        roleOther: 'Prof',
        goal: 'Chat',
        tone: Register.polite,
        level: 'B1',
        fills: const <String, String>{'interest': 'robots'},
      ),
      find: (text) => text == existing.text ? existing : null,
    );
    expect(composed.newChunks.map((c) => c.text), isNot(contains(existing.text)));
    expect(composed.dialogue.chunkIds, contains(existing.id));
  });

  test('title defaults to the template name with a suffix', () {
    final composed = compose(
      DialogueRequest(
        templateSituationId: template.id,
        roleSelf: 'a',
        roleOther: 'b',
        goal: 'c',
        tone: Register.neutral,
        level: 'A2',
        title: '   ',
      ),
    );
    expect(composed.dialogue.title, '${template.name} · my version');
    expect(composed.situation.name, composed.dialogue.title);
  });
}
