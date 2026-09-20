import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../chunks/chunk_providers.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';
import 'practice_providers.dart';

/// Practice tab: what is due, start a session, quick drills.
class PracticeHomeScreen extends ConsumerWidget {
  const PracticeHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(planStatsProvider);
    final drillable = ref.watch(drillablePatternsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Practice')),
      body: RefreshIndicator(
        onRefresh: () async {
          invalidatePracticeViews(ref);
          invalidateChunkViews(ref);
          ref.invalidate(enrolledChunkIdsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: <Widget>[
            AsyncValueView<PlanStats>(
              value: stats,
              onRetry: () => ref.invalidate(planStatsProvider),
              builder: (data) => _DueCard(stats: data),
            ),
            const SectionHeader(
              'Substitution drills',
              subtitle: 'Keep the frame, swap the slot',
            ),
            AsyncValueView<List<SentencePattern>>(
              value: drillable,
              builder: (patterns) {
                if (patterns.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Add chunks with swappable slots to your plan and their '
                      'frames will show up here.',
                    ),
                  );
                }
                return Column(
                  children: <Widget>[
                    for (final pattern in patterns.take(8))
                      ListTile(
                        leading: const Icon(Icons.swap_horiz),
                        title: Text(pattern.frame),
                        subtitle: Text(
                          pattern.slots
                              .map((slot) =>
                                  '${slot.name}: ${slot.validatedVariants.length} fills')
                              .join(' · '),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push(AppRoutes.drill(pattern.id)),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _DueCard extends StatelessWidget {
  const _DueCard({required this.stats});

  final PlanStats stats;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final nothingToDo = stats.dueNow == 0;
    return Card(
      margin: const EdgeInsets.all(16),
      color: nothingToDo ? scheme.surfaceContainerHigh : scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              nothingToDo ? 'All caught up' : '${stats.dueNow} chunks due',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: nothingToDo ? scheme.onSurface : scheme.onPrimaryContainer,
              ),
            ),
            Gaps.xs,
            Text(
              stats.total == 0
                  ? 'Your plan is empty. Build a dialogue and add its chunks.'
                  : nothingToDo
                      ? 'Next reviews: ${_nextDayLabel(stats)}. '
                          '${stats.reviewedToday} reviewed today.'
                      : '${stats.countFor(ChunkStatus.fresh)} new · '
                          '${stats.countFor(ChunkStatus.learning) + stats.countFor(ChunkStatus.relearning)} learning · '
                          '${stats.countFor(ChunkStatus.review)} in review',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: nothingToDo ? scheme.onSurfaceVariant : scheme.onPrimaryContainer,
              ),
            ),
            Gaps.md,
            FilledButton.icon(
              onPressed: stats.total == 0
                  ? () => context.go(AppRoutes.situations)
                  : () => context.push(AppRoutes.practiceSession),
              icon: Icon(stats.total == 0 ? Icons.explore : Icons.play_arrow),
              label: Text(
                stats.total == 0
                    ? 'Find a situation'
                    : nothingToDo
                        ? 'Practice ahead anyway'
                        : 'Start session',
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _nextDayLabel(PlanStats stats) {
    for (var day = 1; day < stats.dueNext7Days.length; day++) {
      if (stats.dueNext7Days[day] > 0) {
        return day == 1
            ? 'tomorrow (${stats.dueNext7Days[day]})'
            : 'in $day days (${stats.dueNext7Days[day]})';
      }
    }
    return 'later than a week';
  }
}
