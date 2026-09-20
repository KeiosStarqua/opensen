import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/register.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/services/dialogue_composer.dart';
import '../../domain/usecases/build_dialogue.dart';
import '../shared/widgets.dart';
import 'situation_providers.dart';

/// Dialog Builder form: your role, the other speaker, the goal, tone, level
/// and one answer per personalisable slot. Generates offline, instantly.
class DialogueBuilderScreen extends ConsumerStatefulWidget {
  const DialogueBuilderScreen({super.key, required this.situationId});

  final String situationId;

  @override
  ConsumerState<DialogueBuilderScreen> createState() =>
      _DialogueBuilderScreenState();
}

class _DialogueBuilderScreenState extends ConsumerState<DialogueBuilderScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _title = TextEditingController();
  final TextEditingController _roleSelf = TextEditingController();
  final TextEditingController _roleOther = TextEditingController();
  final TextEditingController _goal = TextEditingController();
  final Map<String, TextEditingController> _fills =
      <String, TextEditingController>{};
  Register? _tone;
  String? _level;
  bool _seeded = false;
  bool _building = false;

  @override
  void dispose() {
    _title.dispose();
    _roleSelf.dispose();
    _roleOther.dispose();
    _goal.dispose();
    for (final controller in _fills.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _seedFrom(SituationDetail detail) {
    if (_seeded) return;
    _seeded = true;
    final situation = detail.situation;
    _roleSelf.text = situation.roleSelf;
    _roleOther.text = situation.roleOther;
    _goal.text = situation.goal;
    _tone = situation.tone;
    _level = situation.level;
    for (final prompt in situation.prompts) {
      _fills.putIfAbsent(prompt.slot, TextEditingController.new);
    }
  }

  Future<void> _build(SituationDetail detail) async {
    if (_building) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _building = true);
    try {
      final dialogue = await ref.read(buildDialogueUseCaseProvider).call(
            DialogueRequest(
              templateSituationId: detail.situation.id,
              roleSelf: _roleSelf.text,
              roleOther: _roleOther.text,
              goal: _goal.text,
              tone: _tone ?? detail.situation.tone,
              level: _level ?? detail.situation.level,
              title: _title.text,
              fills: <String, String>{
                for (final entry in _fills.entries)
                  entry.key: entry.value.text,
              },
            ),
          );
      ref.invalidate(myDialoguesProvider);
      if (!mounted) return;
      context.pushReplacement(AppRoutes.dialogue(dialogue.id));
    } on DialogueBuildException catch (error) {
      if (!mounted) return;
      showSnack(context, error.message);
      setState(() => _building = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(situationDetailProvider(widget.situationId));
    return Scaffold(
      appBar: AppBar(title: const Text('Build my dialogue')),
      body: AsyncValueView<SituationDetail?>(
        value: detail,
        builder: (data) {
          if (data == null) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Situation not found',
              message: 'Go back and pick another situation.',
            );
          }
          _seedFrom(data);
          final theme = Theme.of(context);
          final situation = data.situation;
          final patternsById = <String, SentencePattern>{
            for (final pattern in data.patterns) pattern.id: pattern,
          };
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: <Widget>[
                Text(
                  situation.name,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Gaps.xs,
                Text(
                  'Tell OpenSen about your version of this conversation. '
                  'Every sentence will be rebuilt around your answers.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                Gaps.lg,
                if (situation.prompts.isNotEmpty) ...<Widget>[
                  Text('Make it yours', style: theme.textTheme.titleMedium),
                  Gaps.sm,
                  for (final prompt in situation.prompts) ...<Widget>[
                    TextFormField(
                      controller: _fills[prompt.slot],
                      decoration: AppTheme.input(
                        prompt.question,
                        hint: prompt.hint,
                      ),
                      textCapitalization: TextCapitalization.none,
                    ),
                    Gaps.xs,
                    _VariantSuggestions(
                      slotName: prompt.slot,
                      patterns: patternsById.values,
                      onPick: (text) => setState(
                        () => _fills[prompt.slot]?.text = text,
                      ),
                    ),
                    Gaps.md,
                  ],
                ],
                Text('The conversation', style: theme.textTheme.titleMedium),
                Gaps.sm,
                TextFormField(
                  controller: _roleSelf,
                  decoration: AppTheme.input('Your role'),
                  validator: _required,
                ),
                Gaps.md,
                TextFormField(
                  controller: _roleOther,
                  decoration: AppTheme.input('Who you are talking to'),
                  validator: _required,
                ),
                Gaps.md,
                TextFormField(
                  controller: _goal,
                  decoration: AppTheme.input('What should this conversation achieve?'),
                  maxLines: 2,
                  validator: _required,
                ),
                Gaps.md,
                Row(
                  children: <Widget>[
                    Expanded(
                      child: DropdownButtonFormField<Register>(
                        initialValue: _tone ?? situation.tone,
                        decoration: AppTheme.input('Tone'),
                        items: <DropdownMenuItem<Register>>[
                          for (final register in Register.values)
                            DropdownMenuItem<Register>(
                              value: register,
                              child: Text(register.label),
                            ),
                        ],
                        onChanged: (value) => setState(() => _tone = value),
                      ),
                    ),
                    Gaps.md,
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _level ?? situation.level,
                        decoration: AppTheme.input('Level'),
                        items: <DropdownMenuItem<String>>[
                          for (final level in cefrLevels)
                            DropdownMenuItem<String>(
                              value: level,
                              child: Text(level),
                            ),
                        ],
                        onChanged: (value) => setState(() => _level = value),
                      ),
                    ),
                  ],
                ),
                Gaps.md,
                TextFormField(
                  controller: _title,
                  decoration: AppTheme.input(
                    'Title (optional)',
                    hint: '${situation.name} · my version',
                  ),
                ),
                Gaps.xl,
                FilledButton.icon(
                  onPressed: _building ? null : () => _build(data),
                  icon: _building
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome),
                  label: Text(_building ? 'Building…' : 'Generate dialogue'),
                ),
                Gaps.sm,
                Text(
                  'Works fully offline — the dialogue is assembled from this '
                  "situation's frames and your answers.",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  static String? _required(String? value) =>
      (value ?? '').trim().isEmpty ? 'Required' : null;
}

/// Known variants for a slot, offered as quick picks under its question.
class _VariantSuggestions extends StatelessWidget {
  const _VariantSuggestions({
    required this.slotName,
    required this.patterns,
    required this.onPick,
  });

  final String slotName;
  final Iterable<SentencePattern> patterns;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final suggestions = <String>{};
    for (final pattern in patterns) {
      final slot = pattern.slotNamed(slotName);
      if (slot == null) continue;
      for (final variant in slot.validatedVariants) {
        suggestions.add(variant.text);
      }
    }
    if (suggestions.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: <Widget>[
        for (final text in suggestions.take(6))
          ActionChip(
            label: Text(text),
            visualDensity: VisualDensity.compact,
            onPressed: () => onPick(text),
          ),
      ],
    );
  }
}
