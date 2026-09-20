import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/services/drill_session.dart';
import '../chunks/chunk_providers.dart';
import '../shared/widgets.dart';

final _patternProvider = FutureProvider.family<SentencePattern?, String>(
  (ref, id) => ref.watch(contentRepositoryProvider).getPattern(id),
);

/// Substitution Drill: see two variants, then keep the frame and fill the
/// slot — first by choosing, then by producing.
class DrillScreen extends ConsumerStatefulWidget {
  const DrillScreen({super.key, required this.patternId});

  final String patternId;

  @override
  ConsumerState<DrillScreen> createState() => _DrillScreenState();
}

class _DrillScreenState extends ConsumerState<DrillScreen> {
  final TextEditingController _answer = TextEditingController();
  DrillSession? _session;
  DrillAnswer? _lastAnswer;

  @override
  void dispose() {
    _answer.dispose();
    super.dispose();
  }

  DrillSession _sessionFor(SentencePattern pattern) =>
      _session ??= DrillSession(pattern: pattern, random: Random());

  Future<void> _submit(DrillSession session, String answer) async {
    if (answer.trim().isEmpty) return;
    final result = session.submit(answer);
    _answer.clear();
    setState(() => _lastAnswer = result);
    if (result != null && result.step == DrillStep.produce) {
      final settings = ref.read(settingsProvider);
      if (settings.ttsEnabled && result.isAcceptable) {
        final sentence = session.pattern.render(<String, String>{
          result.item.slotName: result.answer,
        });
        await ref.read(speechSynthesizerProvider).speak(
              sentence,
              rate: settings.speechRate,
            );
      }
    }
  }

  Future<void> _keepVariant(DrillSession session, DrillAnswer answer) async {
    final slot = session.pattern.slotNamed(answer.item.slotName);
    if (slot == null) return;
    await ref.read(contentRepositoryProvider).addSlotVariant(
          slot.id,
          answer.answer,
        );
    ref.invalidate(_patternProvider(widget.patternId));
    invalidateChunkViews(ref);
    if (!mounted) return;
    setState(() => _lastAnswer = null);
    showSnack(context, 'Saved "${answer.answer}" as your own fill');
  }

  @override
  Widget build(BuildContext context) {
    final pattern = ref.watch(_patternProvider(widget.patternId));
    return Scaffold(
      appBar: AppBar(title: const Text('Substitution drill')),
      body: AsyncValueView<SentencePattern?>(
        value: pattern,
        builder: (data) {
          if (data == null) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Frame not found',
              message: 'It may have been deleted.',
            );
          }
          final session = _sessionFor(data);
          if (session.isEmpty) {
            return const EmptyState(
              icon: Icons.swap_horiz,
              title: 'Nothing to drill yet',
              message: 'This frame needs at least two fills for one slot.',
            );
          }
          if (session.isFinished) {
            return _DrillSummary(
              session: session,
              onAgain: () => setState(() {
                _session = null;
                _lastAnswer = null;
              }),
              onDone: () => context.pop(),
            );
          }
          return _DrillBody(
            session: session,
            lastAnswer: _lastAnswer,
            controller: _answer,
            onSubmit: (answer) => _submit(session, answer),
            onContinue: () => setState(() => _lastAnswer = null),
            onKeepVariant: (answer) => _keepVariant(session, answer),
          );
        },
      ),
    );
  }
}

class _DrillBody extends StatelessWidget {
  const _DrillBody({
    required this.session,
    required this.lastAnswer,
    required this.controller,
    required this.onSubmit,
    required this.onContinue,
    required this.onKeepVariant,
  });

  final DrillSession session;
  final DrillAnswer? lastAnswer;
  final TextEditingController controller;
  final ValueChanged<String> onSubmit;
  final VoidCallback onContinue;
  final ValueChanged<DrillAnswer> onKeepVariant;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final item = session.current!;
    final feedback = lastAnswer;
    final showingFeedback = feedback != null;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        LinearProgressIndicator(value: session.progress),
        Gaps.md,
        Text(
          session.step == DrillStep.choose
              ? 'Step ${session.position + 1} of ${session.total} · pick the fill'
              : 'Step ${session.position + 1} of ${session.total} · say it yourself',
          style: theme.textTheme.labelLarge,
        ),
        Gaps.lg,
        for (final example in item.examples)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              example,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        Gaps.sm,
        Text(
          '→ ${item.prompt}',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        Gaps.lg,
        if (showingFeedback)
          _Feedback(
            answer: feedback,
            onContinue: onContinue,
            onKeepVariant: () => onKeepVariant(feedback),
          )
        else if (session.step == DrillStep.choose) ...<Widget>[
          for (final option in item.options)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: OutlinedButton(
                onPressed: () => onSubmit(option),
                child: Text(option),
              ),
            ),
        ] else ...<Widget>[
          Text(
            'Keep the frame and fill the gap with your own words. Any fill '
            'that fits counts.',
            style: theme.textTheme.bodyMedium,
          ),
          Gaps.sm,
          TextField(
            controller: controller,
            autofocus: true,
            decoration: AppTheme.input(
              'Your fill',
              hint: item.cue ?? 'e.g. ${item.answer}',
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: onSubmit,
          ),
          Gaps.sm,
          FilledButton(
            onPressed: () => onSubmit(controller.text),
            child: const Text('Check'),
          ),
        ],
      ],
    );
  }
}

class _Feedback extends StatelessWidget {
  const _Feedback({
    required this.answer,
    required this.onContinue,
    required this.onKeepVariant,
  });

  final DrillAnswer answer;
  final VoidCallback onContinue;
  final VoidCallback onKeepVariant;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final (IconData icon, String title, Color color) = switch (answer.verdict) {
      DrillVerdict.correct => (Icons.check_circle, 'Exactly.', scheme.primary),
      DrillVerdict.otherVariant => (
          Icons.check_circle_outline,
          'Also a good fill.',
          scheme.secondary,
        ),
      DrillVerdict.unknown => (
          Icons.lightbulb_outline,
          'New fill — does it sound right?',
          scheme.tertiary,
        ),
    };
    final item = answer.item;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(icon, color: color),
                Gaps.sm,
                Text(title, style: theme.textTheme.titleMedium),
              ],
            ),
            Gaps.sm,
            Text('You said: “${answer.answer}”', style: theme.textTheme.bodyLarge),
            if (answer.verdict != DrillVerdict.correct) ...<Widget>[
              Gaps.xs,
              Text(
                'Target: ${item.fullSentence}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
            Gaps.md,
            if (answer.verdict == DrillVerdict.unknown &&
                answer.step == DrillStep.produce) ...<Widget>[
              OutlinedButton.icon(
                onPressed: onKeepVariant,
                icon: const Icon(Icons.add),
                label: const Text('Keep it as my own fill'),
              ),
              Gaps.sm,
            ],
            FilledButton(onPressed: onContinue, child: const Text('Continue')),
          ],
        ),
      ),
    );
  }
}

class _DrillSummary extends StatelessWidget {
  const _DrillSummary({
    required this.session,
    required this.onAgain,
    required this.onDone,
  });

  final DrillSession session;
  final VoidCallback onAgain;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final produced = session.answers
        .where((a) => a.step == DrillStep.produce && a.isAcceptable)
        .length;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Icon(Icons.emoji_events_outlined, size: 56, color: theme.colorScheme.primary),
          Gaps.md,
          Text('Frame drilled', style: theme.textTheme.headlineSmall),
          Gaps.sm,
          Text(
            session.pattern.frame,
            style: theme.textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
          Gaps.md,
          Text(
            '$produced of ${session.total} fills produced correctly · '
            '${session.correctCount} exact matches',
            textAlign: TextAlign.center,
          ),
          Gaps.xl,
          FilledButton(onPressed: onAgain, child: const Text('Drill again')),
          Gaps.sm,
          OutlinedButton(onPressed: onDone, child: const Text('Done')),
        ],
      ),
    );
  }
}
