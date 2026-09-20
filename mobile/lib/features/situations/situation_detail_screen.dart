import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/dialogue.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../shared/widgets.dart';
import 'situation_providers.dart';

/// A situation template: roles, key frames with their slots, a preview of the
/// template dialogue, and the two ways in — build your own or practise as is.
class SituationDetailScreen extends ConsumerWidget {
  const SituationDetailScreen({super.key, required this.situationId});

  final String situationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(situationDetailProvider(situationId));
    return Scaffold(
      appBar: AppBar(title: const Text('Situation')),
      body: AsyncValueView<SituationDetail?>(
        value: detail,
        onRetry: () => ref.invalidate(situationDetailProvider(situationId)),
        builder: (data) {
          if (data == null) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Situation not found',
              message: 'It may have been removed.',
            );
          }
          final theme = Theme.of(context);
          final situation = data.situation;
          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      situation.name,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Gaps.sm,
                    Text(situation.description, style: theme.textTheme.bodyLarge),
                    Gaps.md,
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: <Widget>[
                        Chip(
                          avatar: const Icon(Icons.person, size: 16),
                          label: Text('You: ${situation.roleSelf}'),
                        ),
                        Chip(
                          avatar: const Icon(Icons.people_outline, size: 16),
                          label: Text(situation.roleOther),
                        ),
                        Chip(label: Text(situation.tone.label)),
                        Chip(label: Text('Level ${situation.level}')),
                      ],
                    ),
                    Gaps.md,
                    Text(
                      'Goal: ${situation.goal}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Gaps.lg,
                    FilledButton.icon(
                      onPressed: data.templateDialogue == null
                          ? null
                          : () => context.push(
                                AppRoutes.buildDialogue(situation.id),
                              ),
                      icon: const Icon(Icons.auto_awesome),
                      label: const Text('Build my dialogue'),
                    ),
                    Gaps.sm,
                    OutlinedButton.icon(
                      onPressed: data.chunks.isEmpty
                          ? null
                          : () => _enrollAll(context, ref, data),
                      icon: const Icon(Icons.playlist_add),
                      label: Text('Add ${data.chunks.length} chunks to practice'),
                    ),
                  ],
                ),
              ),
              const SectionHeader(
                'Key frames',
                subtitle: 'Learn fewer patterns, say more things',
              ),
              for (final pattern in data.patterns) _PatternCard(pattern: pattern),
              if (data.templateDialogue != null) ...<Widget>[
                const SectionHeader(
                  'Sample dialogue',
                  subtitle: 'Your version will use your own details',
                ),
                _DialoguePreview(dialogue: data.templateDialogue!),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _enrollAll(
    BuildContext context,
    WidgetRef ref,
    SituationDetail data,
  ) async {
    final practice = ref.read(practiceRepositoryProvider);
    await practice.enroll(
      data.chunks.map((chunk) => chunk.id),
      ref.read(clockProvider).now(),
    );
    ref.invalidate(enrolledChunkIdsProvider);
    if (!context.mounted) return;
    showSnack(context, 'Added to your practice plan');
  }
}

class _PatternCard extends StatelessWidget {
  const _PatternCard({required this.pattern});

  final SentencePattern pattern;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: pattern.hasSlots
            ? () => context.push(AppRoutes.drill(pattern.id))
            : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                pattern.frame,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (pattern.meaning.isNotEmpty) ...<Widget>[
                Gaps.xs,
                Text(
                  pattern.meaning,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              for (final slot in pattern.slots) ...<Widget>[
                Gaps.sm,
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: <Widget>[
                    Text('${slot.name}:', style: theme.textTheme.labelMedium),
                    for (final variant in slot.validatedVariants.take(4))
                      Chip(
                        label: Text(variant.text),
                        visualDensity: VisualDensity.compact,
                      ),
                  ],
                ),
              ],
              if (pattern.hasSlots) ...<Widget>[
                Gaps.sm,
                Row(
                  children: <Widget>[
                    RegisterBadge(pattern.register),
                    Gaps.sm,
                    LevelBadge(pattern.level),
                    const Spacer(),
                    Text('Drill', style: theme.textTheme.labelLarge),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DialoguePreview extends StatelessWidget {
  const _DialoguePreview({required this.dialogue});

  final Dialogue dialogue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          for (final line in dialogue.lines.take(6))
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text.rich(
                TextSpan(
                  children: <InlineSpan>[
                    TextSpan(
                      text: line.speaker == Speaker.self ? 'You: ' : 'Them: ',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: line.speaker == Speaker.self
                            ? theme.colorScheme.primary
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    TextSpan(text: line.text, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
          if (dialogue.lines.length > 6)
            Text(
              '… ${dialogue.lines.length - 6} more lines',
              style: theme.textTheme.bodySmall,
            ),
        ],
      ),
    );
  }
}
