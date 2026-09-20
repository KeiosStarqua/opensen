import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../chunks/chunk_providers.dart';
import '../practice/practice_providers.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';

/// Today tab: the daily re-entry point (design doc §5.2). Due count with a
/// one-tap Start Practice, today's goal ring, upcoming reviews, recent
/// chunks and quick substitution drills.
class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(planStatsProvider);
    final recents = ref.watch(recentChunksProvider);
    final drillable = ref.watch(drillablePatternsProvider);
    final streak = stats.value?.streakDays ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Today'),
        actions: <Widget>[
          if (streak > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Chip(
                avatar: const Icon(
                  Icons.local_fire_department_outlined,
                  size: 18,
                ),
                label: Text('$streak'),
                visualDensity: VisualDensity.compact,
              ),
            ),
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          invalidatePracticeViews(ref);
          invalidateChunkViews(ref);
          ref.invalidate(enrolledChunkIdsProvider);
        },
        child: AsyncValueView<PlanStats>(
          value: stats,
          onRetry: () => ref.invalidate(planStatsProvider),
          builder: (data) => ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: <Widget>[
              _PlanCard(stats: data),
              if (data.total > 0) ...<Widget>[
                _Upcoming(stats: data),
                const SectionHeader('Recent practice'),
                AsyncValueView<List<Chunk>>(
                  value: recents,
                  builder: (chunks) {
                    if (chunks.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Nothing reviewed yet — recently practised chunks '
                          'will show up here.',
                        ),
                      );
                    }
                    return Column(
                      children: <Widget>[
                        for (final chunk in chunks)
                          ChunkTile(
                            chunk: chunk,
                            onTap: () =>
                                context.push(AppRoutes.chunk(chunk.id)),
                          ),
                      ],
                    );
                  },
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
                          'Add chunks with swappable slots to your plan and '
                          'their frames will show up here.',
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
                            onTap: () =>
                                context.push(AppRoutes.drill(pattern.id)),
                          ),
                      ],
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Plan card: due count, estimated minutes, daily goal ring, primary CTA.
/// Empty plans route to Situations instead of showing a disabled button.
class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.stats});

  final PlanStats stats;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    if (stats.total == 0) {
      return Card(
        margin: const EdgeInsets.all(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Start with a situation',
                style: theme.textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              Gaps.xs,
              Text(
                'Your plan is empty. Build a dialogue and add its chunks.',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              Gaps.md,
              FilledButton.icon(
                onPressed: () => context.go(AppRoutes.situations),
                icon: const Icon(Icons.explore),
                label: const Text('Explore situations'),
              ),
            ],
          ),
        ),
      );
    }
    final nothingToDo = stats.dueNow == 0;
    final minutes = (stats.dueNow * 20 / 60).ceil();
    final todayTotal = stats.reviewedToday + stats.dueNow;
    final progress = todayTotal == 0 ? 0.0 : stats.reviewedToday / todayTotal;
    final foreground = nothingToDo ? scheme.onSurface : scheme.onPrimaryContainer;
    return Card(
      margin: const EdgeInsets.all(16),
      color: nothingToDo ? scheme.surfaceContainerHigh : scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        nothingToDo
                            ? 'All caught up'
                            : '${stats.dueNow} chunks due',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: foreground,
                        ),
                      ),
                      Gaps.xs,
                      Text(
                        nothingToDo
                            ? 'Next reviews: ${_nextDayLabel(stats)}. '
                                '${stats.reviewedToday} reviewed today.'
                            : '${stats.countFor(ChunkStatus.fresh)} new · '
                                '${stats.countFor(ChunkStatus.learning) + stats.countFor(ChunkStatus.relearning)} learning · '
                                '~$minutes min',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(color: foreground),
                      ),
                    ],
                  ),
                ),
                Gaps.md,
                _GoalRing(progress: progress, done: stats.reviewedToday),
              ],
            ),
            Gaps.md,
            FilledButton.icon(
              onPressed: () => context.push(AppRoutes.practiceSession),
              icon: const Icon(Icons.play_arrow),
              label: Text(nothingToDo ? 'Practice ahead anyway' : 'Start Practice'),
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

/// Quiet daily-goal ring: reviewed today out of today's total queue.
class _GoalRing extends StatelessWidget {
  const _GoalRing({required this.progress, required this.done});

  final double progress;
  final int done;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          CircularProgressIndicator(
            value: progress,
            strokeWidth: 5,
            color: scheme.primary,
            backgroundColor: scheme.surfaceContainerHighest,
          ),
          Text(
            '$done',
            style: theme.textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

/// Next three days of due counts.
class _Upcoming extends StatelessWidget {
  const _Upcoming({required this.stats});

  final PlanStats stats;

  static const List<String> _weekdays = <String>[
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: <Widget>[
          for (var day = 1; day <= 3; day++) ...<Widget>[
            Expanded(
              child: Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Column(
                    children: <Widget>[
                      Text(
                        '${stats.dueNext7Days[day]}',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        day == 1
                            ? 'Tomorrow'
                            : _weekdays[
                                (now.add(Duration(days: day)).weekday - 1) % 7],
                        style: theme.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (day < 3) Gaps.sm,
          ],
        ],
      ),
    );
  }
}
