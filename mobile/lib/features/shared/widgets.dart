import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/register.dart';
import '../../domain/services/slot_template.dart';

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
            if (action != null) Gaps.lg,
            ?action,
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
          ?action,
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

/// Practice-session header: close, progress bar, item counter. No timer, no
/// score (design doc §4.14).
class SessionHeader extends StatelessWidget {
  const SessionHeader({
    super.key,
    required this.progress,
    required this.done,
    required this.total,
    required this.onClose,
    this.trailing,
  });

  final double progress;
  final int done;
  final int total;
  final VoidCallback onClose;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 8, 0),
      child: Row(
        children: <Widget>[
          IconButton(
            tooltip: 'End session',
            icon: const Icon(Icons.close),
            onPressed: onClose,
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: progress, minHeight: 6),
            ),
          ),
          Gaps.sm,
          Text('$done of $total', style: theme.textTheme.labelMedium),
          Gaps.sm,
          ?trailing,
        ],
      ),
    );
  }
}

/// The four FSRS grades with the interval each would schedule, so grading is
/// informed (design doc §4.14). Fixed order left→right by severity.
class GradingBar extends StatelessWidget {
  const GradingBar({
    super.key,
    required this.onGrade,
    required this.intervals,
    this.enabled = true,
  });

  final void Function(ReviewRating rating) onGrade;

  /// Human interval per rating, e.g. `1m`, `4d`.
  final Map<ReviewRating, String> intervals;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return Row(
      children: <Widget>[
        for (final rating in ReviewRating.values) ...<Widget>[
          Expanded(
            child: _GradeButton(
              rating: rating,
              interval: intervals[rating] ?? '',
              color: StateColors.forRating(rating, brightness),
              enabled: enabled,
              onPressed: () {
                HapticFeedback.lightImpact();
                onGrade(rating);
              },
            ),
          ),
          if (rating != ReviewRating.easy) Gaps.sm,
        ],
      ],
    );
  }
}

class _GradeButton extends StatelessWidget {
  const _GradeButton({
    required this.rating,
    required this.interval,
    required this.color,
    required this.enabled,
    required this.onPressed,
  });

  final ReviewRating rating;
  final String interval;
  final Color color;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: enabled ? onPressed : null,
      style: FilledButton.styleFrom(
        backgroundColor: color,
        foregroundColor: StateColors.onColor(color),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(rating.label, style: const TextStyle(fontWeight: FontWeight.w600)),
          Text(interval, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}

/// Renders frames and prompts with `{slot}` markers and `_____` blanks as
/// styled inline gaps (design doc §4.1 slot rendering): filled slots are
/// chips, unfilled slots and blanks are underline boxes.
class SlotBlankText extends StatelessWidget {
  const SlotBlankText(
    this.text, {
    super.key,
    this.style,
    this.fills = const <String, String>{},
  });

  final String text;
  final TextStyle? style;

  /// Slot fills by slot name. A `{slot}` without a fill renders as a blank.
  final Map<String, String> fills;

  static final RegExp _token =
      RegExp('${SlotTemplate.slotPattern.pattern}|_____+');

  @override
  Widget build(BuildContext context) {
    if (!_token.hasMatch(text)) {
      return Text(text, style: style);
    }
    final scheme = Theme.of(context).colorScheme;
    final spans = <InlineSpan>[];
    var index = 0;
    for (final match in _token.allMatches(text)) {
      if (match.start > index) {
        spans.add(TextSpan(text: text.substring(index, match.start)));
      }
      final token = match.group(0)!;
      final slot = SlotTemplate.slotPattern.firstMatch(token)?.group(1);
      final fill = slot == null ? null : fills[slot];
      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.baseline,
          baseline: TextBaseline.alphabetic,
          child: Semantics(
            label: fill == null ? 'blank' : 'slot: $fill',
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: fill == null ? null : scheme.secondaryContainer,
                borderRadius: BorderRadius.circular(AppRadii.sm),
                border: fill == null
                    ? Border(
                        bottom: BorderSide(color: scheme.outline, width: 2),
                      )
                    : null,
              ),
              child: Text(
                fill ?? '      ',
                style: fill == null
                    ? style
                    : style?.copyWith(color: scheme.onSecondaryContainer),
              ),
            ),
          ),
        ),
      );
      index = match.end;
    }
    if (index < text.length) {
      spans.add(TextSpan(text: text.substring(index)));
    }
    return Text.rich(TextSpan(children: spans), style: style);
  }
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
