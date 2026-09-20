import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/practice.dart';
import '../practice/practice_providers.dart';
import '../shared/widgets.dart';

/// Practice Plan dashboard: due now, the week ahead, deck status, streak,
/// plus Anki export and settings.
class PlanScreen extends ConsumerWidget {
  const PlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(planStatsProvider);
    final retention = ref.watch(settingsProvider.select((s) => s.desiredRetention));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Practice Plan'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => invalidatePracticeViews(ref),
        child: AsyncValueView<PlanStats>(
          value: stats,
          onRetry: () => ref.invalidate(planStatsProvider),
          builder: (data) {
            final theme = Theme.of(context);
            return ListView(
              padding: const EdgeInsets.all(16),
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: _StatCard(
                        label: 'Due now',
                        value: '${data.dueNow}',
                        icon: Icons.notifications_active_outlined,
                        emphasis: data.dueNow > 0,
                      ),
                    ),
                    Gaps.sm,
                    Expanded(
                      child: _StatCard(
                        label: 'Reviewed today',
                        value: '${data.reviewedToday}',
                        icon: Icons.today_outlined,
                      ),
                    ),
                    Gaps.sm,
                    Expanded(
                      child: _StatCard(
                        label: 'Day streak',
                        value: '${data.streakDays}',
                        icon: Icons.local_fire_department_outlined,
                      ),
                    ),
                  ],
                ),
                Gaps.lg,
                Text('Next 7 days', style: theme.textTheme.titleMedium),
                Gaps.sm,
                _WeekBars(counts: data.dueNext7Days),
                Gaps.lg,
                Text('Your chunks', style: theme.textTheme.titleMedium),
                Gaps.sm,
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: <Widget>[
                        _StatusRow(
                          label: 'Total in plan',
                          count: data.total,
                          total: data.total,
                          color: theme.colorScheme.primary,
                        ),
                        for (final status in ChunkStatus.values)
                          _StatusRow(
                            label: status.label,
                            count: data.countFor(status),
                            total: data.total,
                            color: switch (status) {
                              ChunkStatus.fresh => theme.colorScheme.tertiary,
                              ChunkStatus.learning => theme.colorScheme.primary,
                              ChunkStatus.relearning => theme.colorScheme.error,
                              ChunkStatus.review => theme.colorScheme.secondary,
                            },
                          ),
                        Gaps.sm,
                        Text(
                          'Scheduling: FSRS, target retention '
                          '${(retention * 100).round()}%.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Gaps.lg,
                FilledButton.icon(
                  onPressed: data.dueNow == 0 && data.total == 0
                      ? null
                      : () => context.push(AppRoutes.practiceSession),
                  icon: const Icon(Icons.play_arrow),
                  label: Text(
                    data.dueNow > 0 ? 'Review ${data.dueNow} due' : 'Practice ahead',
                  ),
                ),
                Gaps.sm,
                OutlinedButton.icon(
                  onPressed: () => context.push(AppRoutes.export),
                  icon: const Icon(Icons.ios_share),
                  label: const Text('Export to Anki'),
                ),
                Gaps.xl,
              ],
            );
          },
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    this.emphasis = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Card(
      color: emphasis ? scheme.primaryContainer : null,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Icon(icon, size: 20, color: scheme.onSurfaceVariant),
            Gaps.sm,
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(label, style: theme.textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}

class _WeekBars extends StatelessWidget {
  const _WeekBars({required this.counts});

  final List<int> counts;

  static const List<String> _dayLetters = <String>['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final maxCount = counts.fold<int>(1, (max, c) => c > max ? c : max);
    final today = DateTime.now().weekday; // 1 = Monday
    return SizedBox(
      height: 96,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: <Widget>[
          for (var day = 0; day < counts.length; day++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: <Widget>[
                    Text('${counts[day]}', style: theme.textTheme.labelSmall),
                    Gaps.xs,
                    Container(
                      height: 8 + 48 * counts[day] / maxCount,
                      decoration: BoxDecoration(
                        color: day == 0 ? scheme.primary : scheme.primaryContainer,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    Gaps.xs,
                    Text(
                      day == 0 ? 'Today' : _dayLetters[(today - 1 + day) % 7],
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.label,
    required this.count,
    required this.total,
    required this.color,
  });

  final String label;
  final int count;
  final int total;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: <Widget>[
          SizedBox(width: 110, child: Text(label, style: theme.textTheme.bodyMedium)),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: total == 0 ? 0 : count / total,
                minHeight: 8,
                color: color,
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
              ),
            ),
          ),
          Gaps.sm,
          SizedBox(
            width: 32,
            child: Text(
              '$count',
              textAlign: TextAlign.end,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
