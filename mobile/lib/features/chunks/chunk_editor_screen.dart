import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/register.dart';
import '../../domain/entities/situation.dart';
import '../../domain/services/slot_template.dart';
import '../../domain/usecases/create_custom_chunk.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';
import 'chunk_providers.dart';

/// Add your own sentence. Writing `{slot}` inside it turns the sentence into
/// a frame with swappable fills — your personal sentence graph grows.
class ChunkEditorScreen extends ConsumerStatefulWidget {
  const ChunkEditorScreen({super.key, this.situationId});

  final String? situationId;

  @override
  ConsumerState<ChunkEditorScreen> createState() => _ChunkEditorScreenState();
}

class _ChunkEditorScreenState extends ConsumerState<ChunkEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _frame = TextEditingController();
  final TextEditingController _meaning = TextEditingController();
  final Map<String, TextEditingController> _variants =
      <String, TextEditingController>{};
  Register _register = Register.neutral;
  String _level = 'B1';
  String? _situationId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _situationId = widget.situationId;
    _frame.addListener(_syncSlots);
  }

  @override
  void dispose() {
    _frame.dispose();
    _meaning.dispose();
    for (final controller in _variants.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _syncSlots() {
    final names = SlotTemplate.slotNames(_frame.text);
    var changed = false;
    for (final name in names) {
      if (!_variants.containsKey(name)) {
        _variants[name] = TextEditingController();
        changed = true;
      }
    }
    if (changed || names.length != _variants.length) setState(() {});
  }

  Future<void> _save() async {
    if (_saving) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    final slotNames = SlotTemplate.slotNames(_frame.text);
    try {
      final chunk = await ref.read(createCustomChunkUseCaseProvider).call(
            CustomChunkInput(
              frame: _frame.text,
              meaning: _meaning.text,
              register: _register,
              level: _level,
              situationId: _situationId,
              variantsBySlot: <String, List<String>>{
                for (final name in slotNames)
                  name: (_variants[name]?.text ?? '')
                      .split(RegExp(r'[,\n]'))
                      .map((v) => v.trim())
                      .where((v) => v.isNotEmpty)
                      .toList(),
              },
            ),
          );
      invalidateChunkViews(ref);
      if (!mounted) return;
      context.pushReplacement(AppRoutes.chunk(chunk.id));
    } on CustomChunkException catch (error) {
      if (!mounted) return;
      showSnack(context, error.message);
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final situations = ref.watch(situationTemplatesProvider);
    final slotNames = SlotTemplate.slotNames(_frame.text);
    return Scaffold(
      appBar: AppBar(title: const Text('My sentence')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            Text(
              'Write a sentence you want to be able to say. Put the part that '
              'changes in curly braces to make it a frame, e.g. '
              '"I\'m allergic to {food}".',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            Gaps.md,
            TextFormField(
              controller: _frame,
              decoration: AppTheme.input(
                'Sentence or frame',
                hint: "Could you tell me more about {topic}?",
              ),
              maxLines: 2,
              validator: (value) =>
                  (value ?? '').trim().isEmpty ? 'Write a sentence' : null,
            ),
            Gaps.md,
            TextFormField(
              controller: _meaning,
              decoration: AppTheme.input(
                'Meaning',
                hint: 'When would you say this? In your own words.',
              ),
              maxLines: 2,
              validator: (value) =>
                  (value ?? '').trim().isEmpty ? 'Add a meaning' : null,
            ),
            for (final name in slotNames) ...<Widget>[
              Gaps.md,
              TextFormField(
                controller: _variants[name],
                decoration: AppTheme.input(
                  'Fills for {$name}',
                  hint: 'peanuts, shellfish, dairy',
                ),
                validator: (value) => (value ?? '').trim().isEmpty
                    ? 'Add at least one fill, separated by commas'
                    : null,
              ),
            ],
            Gaps.md,
            Row(
              children: <Widget>[
                Expanded(
                  child: DropdownButtonFormField<Register>(
                    initialValue: _register,
                    decoration: AppTheme.input('Register'),
                    items: <DropdownMenuItem<Register>>[
                      for (final register in Register.values)
                        DropdownMenuItem<Register>(
                          value: register,
                          child: Text(register.label),
                        ),
                    ],
                    onChanged: (value) =>
                        setState(() => _register = value ?? _register),
                  ),
                ),
                Gaps.md,
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _level,
                    decoration: AppTheme.input('Level'),
                    items: <DropdownMenuItem<String>>[
                      for (final level in cefrLevels)
                        DropdownMenuItem<String>(value: level, child: Text(level)),
                    ],
                    onChanged: (value) => setState(() => _level = value ?? _level),
                  ),
                ),
              ],
            ),
            Gaps.md,
            AsyncValueView<List<Situation>>(
              value: situations,
              builder: (list) => DropdownButtonFormField<String?>(
                initialValue: _situationId,
                decoration: AppTheme.input('Situation (optional)'),
                items: <DropdownMenuItem<String?>>[
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('None'),
                  ),
                  for (final situation in list)
                    DropdownMenuItem<String?>(
                      value: situation.id,
                      child: Text(situation.name),
                    ),
                ],
                onChanged: (value) => setState(() => _situationId = value),
              ),
            ),
            Gaps.xl,
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save_outlined),
              label: Text(_saving ? 'Saving…' : 'Save to my library'),
            ),
          ],
        ),
      ),
    );
  }
}
