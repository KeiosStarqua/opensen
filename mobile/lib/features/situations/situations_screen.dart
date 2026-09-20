import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/dialogue.dart';
import '../../domain/entities/situation.dart';
import '../shared/widgets.dart';
import 'situation_providers.dart';

/// Home: build a new dialogue, reopen your own, or browse situation
/// templates by category.
class SituationsScreen extends ConsumerWidget {
  const SituationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templates = ref.watch(situationTemplatesProvider);
    final mine = ref.watch(myDialoguesProvider);
    final goal = ref.watch(settingsProvider.select((s) => s.goal));
    return Scaffold(
      appBar: AppBar(title: const Text('Situations')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(situationTemplatesProvider);
          ref.invalidate(myDialoguesProvider);
        },
        child: ListView(
          children: <Widget>[
            _HeroCard(goal: goal),
            AsyncValueView<List<Dialogue>>(
              value: mine,
              builder: (dialogues) => dialogues.isEmpty
                  ? const SizedBox.shrink()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        SectionHeader(
                          'Your dialogues',
                          subtitle: '${dialogues.length} built so far',
                        ),
                        for (final dialogue in dialogues.take(5))
                          ListTile(
                            leading: const Icon(Icons.chat_bubble_outline),
                            title: Text(dialogue.title),
                            subtitle: Text(
                              'Level ${dialogue.level} · '
                              '${_relativeDate(dialogue.createdAt)}',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () =>
                                context.push(AppRoutes.dialogue(dialogue.id)),
                          ),
                      ],
                    ),
            ),
            AsyncValueView<List<Situation>>(
              value: templates,
              onRetry: () => ref.invalidate(situationTemplatesProvider),
              builder: (situations) {
                final ordered = <SituationCategory>[
                  for (final category in SituationCategory.values)
                    if (category.key == goal) category,
                  for (final category in SituationCategory.values)
                    if (category.key != goal) category,
                ];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    for (final category in ordered)
                      if (situations.any((s) => s.category == category)) ...<Widget>[
                        SectionHeader(category.label),
                        for (final situation in situations
                            .where((s) => s.category == category))
                          _SituationTile(situation: situation),
                      ],
                    Gaps.xl,
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  static String _relativeDate(DateTime createdAt) {
    final days = DateTime.now().toUtc().difference(createdAt).inDays;
    if (days <= 0) return 'today';
    if (days == 1) return 'yesterday';
    if (days < 30) return '$days days ago';
    return '${(days / 30).round()} months ago';
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.goal});

  final String? goal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      color: scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'What conversation do you need soon?',
              style: theme.textTheme.titleLarge?.copyWith(
                color: scheme.onPrimaryContainer,
                fontWeight: FontWeight.w700,
              ),
            ),
            Gaps.sm,
            Text(
              'Pick a situation below, add your own details, and get a '
              'dialogue you can practise in under a minute.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: scheme.onPrimaryContainer,
              ),
            ),
            if (goal != null) ...<Widget>[
              Gaps.sm,
              Text(
                'Your goal: ${SituationCategory.fromKey(goal).label}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: scheme.onPrimaryContainer,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SituationTile extends StatelessWidget {
  const _SituationTile({required this.situation});

  final Situation situation;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(situation.name),
      subtitle: Text(
        '${situation.roleSelf} ↔ ${situation.roleOther}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Wrap(
        spacing: 6,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: <Widget>[
          LevelBadge(situation.level),
          const Icon(Icons.chevron_right),
        ],
      ),
      onTap: () => context.push(AppRoutes.situation(situation.id)),
    );
  }
}
