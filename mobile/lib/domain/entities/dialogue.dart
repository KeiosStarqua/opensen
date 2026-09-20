/// Who says a dialogue line. `self` lines are the ones the learner rehearses.
enum Speaker {
  self('self'),
  other('other');

  const Speaker(this.key);

  final String key;

  static Speaker fromKey(String? key) =>
      key == Speaker.self.key ? Speaker.self : Speaker.other;
}

class DialogueLine {
  const DialogueLine({
    required this.id,
    required this.dialogueId,
    required this.position,
    required this.speaker,
    required this.text,
    this.chunkIds = const <String>[],
  });

  final String id;
  final String dialogueId;
  final int position;
  final Speaker speaker;
  final String text;

  /// Chunks this line uses, in order of appearance.
  final List<String> chunkIds;
}

/// A multi-turn conversation script for a situation. Template dialogues carry
/// `{slot}` markers in their lines; instances are fully rendered.
class Dialogue {
  const Dialogue({
    required this.id,
    required this.situationId,
    required this.title,
    required this.level,
    required this.createdBy,
    required this.isTemplate,
    required this.createdAt,
    this.sourceTemplateId,
    this.lines = const <DialogueLine>[],
  });

  final String id;
  final String situationId;
  final String title;
  final String level;
  final String createdBy;
  final bool isTemplate;
  final String? sourceTemplateId;
  final DateTime createdAt;
  final List<DialogueLine> lines;

  /// Distinct chunk ids across all lines, in first-appearance order.
  List<String> get chunkIds {
    final seen = <String>{};
    final ordered = <String>[];
    for (final line in lines) {
      for (final id in line.chunkIds) {
        if (seen.add(id)) ordered.add(id);
      }
    }
    return ordered;
  }

  Dialogue copyWith({List<DialogueLine>? lines, String? title}) => Dialogue(
        id: id,
        situationId: situationId,
        title: title ?? this.title,
        level: level,
        createdBy: createdBy,
        isTemplate: isTemplate,
        sourceTemplateId: sourceTemplateId,
        createdAt: createdAt,
        lines: lines ?? this.lines,
      );
}
