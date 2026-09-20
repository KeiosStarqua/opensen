import 'register.dart';

/// Coarse grouping used for Situation Coverage and onboarding goals.
enum SituationCategory {
  travel('travel', 'Travel'),
  work('work', 'Work'),
  study('study', 'Study abroad'),
  daily('daily', 'Daily life'),
  social('social', 'Social');

  const SituationCategory(this.key, this.label);

  final String key;
  final String label;

  static SituationCategory fromKey(String? key) =>
      SituationCategory.values.firstWhere(
        (category) => category.key == key,
        orElse: () => SituationCategory.daily,
      );
}

/// A question the Dialog Builder asks so the learner can personalise one slot
/// of the situation's dialogue (for example `topic` → "What are you
/// interested in?").
class SlotPrompt {
  const SlotPrompt({required this.slot, required this.question, this.hint});

  factory SlotPrompt.fromJson(Map<String, dynamic> json) => SlotPrompt(
        slot: json['slot'] as String,
        question: json['question'] as String,
        hint: json['hint'] as String?,
      );

  final String slot;
  final String question;
  final String? hint;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'slot': slot,
        'question': question,
        if (hint != null) 'hint': hint,
      };
}

/// A real-world context the learner needs to handle.
///
/// Templates (`isTemplate == true`) ship with the app; instances are created by
/// the Dialog Builder from a template plus the learner's own roles and goal.
class Situation {
  const Situation({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.roleSelf,
    required this.roleOther,
    required this.goal,
    required this.tone,
    required this.level,
    required this.isTemplate,
    required this.createdAt,
    this.sourceTemplateId,
    this.prompts = const <SlotPrompt>[],
  });

  final String id;
  final String name;
  final String description;
  final SituationCategory category;
  final String roleSelf;
  final String roleOther;
  final String goal;
  final Register tone;
  final String level;
  final bool isTemplate;
  final String? sourceTemplateId;
  final List<SlotPrompt> prompts;
  final DateTime createdAt;

  Situation copyWith({
    String? id,
    String? name,
    String? description,
    SituationCategory? category,
    String? roleSelf,
    String? roleOther,
    String? goal,
    Register? tone,
    String? level,
    bool? isTemplate,
    String? sourceTemplateId,
    List<SlotPrompt>? prompts,
    DateTime? createdAt,
  }) {
    return Situation(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      roleSelf: roleSelf ?? this.roleSelf,
      roleOther: roleOther ?? this.roleOther,
      goal: goal ?? this.goal,
      tone: tone ?? this.tone,
      level: level ?? this.level,
      isTemplate: isTemplate ?? this.isTemplate,
      sourceTemplateId: sourceTemplateId ?? this.sourceTemplateId,
      prompts: prompts ?? this.prompts,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
