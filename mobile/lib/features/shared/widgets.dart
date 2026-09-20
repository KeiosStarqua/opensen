import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/register.dart';

/// Renders loading / error / data for an [AsyncValue] with consistent chrome.
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.builder,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: builder,
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, stackTrace) => EmptyState(
        icon: Icons.error_outline,
        title: 'Something went wrong',
        message: '$error',
        action: onRetry == null
            ? null
            : OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: 48, color: theme.colorScheme.primary),
            Gaps.md,
            Text(
              title,
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            Gaps.sm,
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...<Widget>[Gaps.lg, action!],
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.action, this.subtitle});

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: theme.textTheme.titleMedium),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class RegisterBadge extends StatelessWidget {
  const RegisterBadge(this.register, {super.key});

  final Register register;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        register.label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: scheme.onSecondaryContainer,
            ),
      ),
    );
  }
}

class LevelBadge extends StatelessWidget {
  const LevelBadge(this.level, {super.key});

  final String level;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(level, style: Theme.of(context).textTheme.labelSmall),
    );
  }
}

/// Small coloured dot describing the FSRS status of a chunk.
class StatusDot extends StatelessWidget {
  const StatusDot(this.state, {super.key, required this.now});

  final UserChunkState? state;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final Color color;
    final String tooltip;
    final current = state;
    if (current == null) {
      color = scheme.outlineVariant;
      tooltip = 'Not in your plan';
    } else if (current.isDue(now)) {
      color = scheme.error;
      tooltip = 'Due now';
    } else {
      color = switch (current.status) {
        ChunkStatus.fresh => scheme.tertiary,
        ChunkStatus.learning => scheme.primary,
        ChunkStatus.relearning => scheme.primary,
        ChunkStatus.review => scheme.secondary,
      };
      tooltip = 'Next: ${formatDue(current.nextReview, now)}';
    }
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }
}

class ChunkTile extends StatelessWidget {
  const ChunkTile({
    super.key,
    required this.chunk,
    this.state,
    this.now,
    this.onTap,
    this.trailing,
    this.highlight = false,
  });

  final Chunk chunk;
  final UserChunkState? state;
  final DateTime? now;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      onTap: onTap,
      leading: now == null ? null : StatusDot(state, now: now!),
      title: Text(
        chunk.text,
        style: theme.textTheme.bodyLarge?.copyWith(
          fontWeight: highlight ? FontWeight.w600 : FontWeight.w500,
        ),
      ),
      subtitle: chunk.meaning.isEmpty
          ? null
          : Text(
              chunk.meaning,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
      trailing: trailing ??
          Wrap(
            spacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: <Widget>[
              RegisterBadge(chunk.register),
              if (!chunk.isTemplate) const Icon(Icons.person_outline, size: 16),
            ],
          ),
    );
  }
}

/// Human interval such as `1m`, `3h`, `4d`, `2mo`.
String formatInterval(Duration duration) {
  if (duration.inMinutes < 1) return '<1m';
  if (duration.inMinutes < 60) return '${duration.inMinutes}m';
  if (duration.inHours < 24) return '${duration.inHours}h';
  if (duration.inDays < 30) return '${duration.inDays}d';
  if (duration.inDays < 365) return '${(duration.inDays / 30).round()}mo';
  return '${(duration.inDays / 365).toStringAsFixed(1)}y';
}

/// `now`, `in 10m`, `in 3d`, or `overdue`.
String formatDue(DateTime? due, DateTime now) {
  if (due == null || !due.isAfter(now)) return 'now';
  return 'in ${formatInterval(due.difference(now))}';
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Confirmation dialog; resolves true when the destructive action is chosen.
Future<bool> confirm(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Delete',
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}
