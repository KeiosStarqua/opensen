import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/platform/speech_synthesizer.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/practice.dart';
import '../../domain/services/answer_matcher.dart';
import '../../domain/services/practice_session.dart';
import '../chunks/chunk_providers.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';
import 'practice_providers.dart';

enum _Phase { loading, prompt, reveal, finished, empty }

/// Recall Practice session: one chunk at a time, always production first
/// (say or type), then reveal, then grade. Forgot / Hard / Good / Easy show
/// the interval each grade would schedule.
class PracticeSessionScreen extends ConsumerStatefulWidget {
  const PracticeSessionScreen({super.key});

  @override
  ConsumerState<PracticeSessionScreen> createState() =>
      _PracticeSessionScreenState();
}

class _PracticeSessionScreenState extends ConsumerState<PracticeSessionScreen> {
  final TextEditingController _typed = TextEditingController();
  late final SpeechSynthesizer _speech;
  PracticeSession? _session;
  _Phase _phase = _Phase.loading;
  bool _usedHint = false;
  bool _showHint = false;
  double? _matchScore;
  String? _transcript;
  bool _grading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _speech = ref.read(speechSynthesizerProvider);
    _load();
  }

  @override
  void dispose() {
    _typed.dispose();
    _speech.stop();
    super.dispose();
  }

  bool get _canSpeak =>
      _speech.isAvailable && ref.read(settingsProvider).ttsEnabled;

  Future<void> _load() async {
    setState(() {
      _phase = _Phase.loading;
      _error = null;
    });
    try {
      final settings = ref.read(settingsProvider);
      final entries = await ref
          .read(startPracticeSessionUseCaseProvider)
          .call(settings, practiceAhead: true);
      if (!mounted) return;
      if (entries.isEmpty) {
        setState(() => _phase = _Phase.empty);
        return;
      }
      _session = PracticeSession(entries: entries, canSpeak: _canSpeak);
      _startPrompt();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = '$error';
        _phase = _Phase.empty;
      });
    }
  }

  void _startPrompt() {
    final session = _session;
    if (session == null || session.isFinished) {
      setState(() => _phase = _Phase.finished);
      return;
    }
    _typed.clear();
    setState(() {
      _phase = _Phase.prompt;
      _usedHint = false;
      _showHint = false;
      _matchScore = null;
      _transcript = null;
      _grading = false;
    });
    final item = session.currentItem;
    if (item?.spokenText != null && _canSpeak) {
      _speak(item!.spokenText!);
    }
  }

  Future<void> _speak(String text) => _speech.speak(
        text,
        rate: ref.read(settingsProvider).speechRate,
      );

  void _reveal() {
    final item = _session?.currentItem;
    if (item == null) return;
    final typed = _typed.text.trim();
    setState(() {
      _phase = _Phase.reveal;
      if (typed.isNotEmpty) {
        _transcript = typed;
        _matchScore = AnswerMatcher.similarity(item.expected, typed);
      }
    });
    if (item.mode != PracticeMode.listenRepeat && _canSpeak) {
      _speak(item.expected);
    }
  }

  Future<void> _grade(ReviewRating rating) async {
    final session = _session;
    final entry = session?.current;
    final item = session?.currentItem;
    if (session == null || entry == null || item == null || _grading) return;
    setState(() => _grading = true);
    try {
      final next = await ref.read(recordReviewUseCaseProvider).call(
            state: entry.state,
            rating: rating,
            item: item,
            transcript: _transcript,
            matchScore: _matchScore,
            usedHint: _usedHint,
          );
      session.complete(rating, next, ref.read(clockProvider).now());
      invalidatePracticeViews(ref);
      invalidateChunkViews(ref);
      ref.invalidate(enrolledChunkIdsProvider);
      if (!mounted) return;
      _startPrompt();
    } catch (error) {
      if (!mounted) return;
      setState(() => _grading = false);
      showSnack(context, 'Could not save review: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recall practice'),
        actions: <Widget>[
          if (_phase == _Phase.prompt || _phase == _Phase.reveal)
            TextButton(
              onPressed: () {
                _session?.skip();
                _startPrompt();
              },
              child: const Text('Skip'),
            ),
        ],
      ),
      body: switch (_phase) {
        _Phase.loading => const Center(child: CircularProgressIndicator()),
        _Phase.empty => EmptyState(
            icon: _error == null ? Icons.check_circle_outline : Icons.error_outline,
            title: _error == null ? 'Nothing to practise' : 'Could not start',
            message: _error ??
                'Add chunks to your plan from a dialogue or the library first.',
            action: OutlinedButton(
              onPressed: () => context.pop(),
              child: const Text('Back'),
            ),
          ),
        _Phase.finished => _Summary(
            session: _session!,
            onMore: _load,
            onDone: () => context.pop(),
          ),
        _Phase.prompt || _Phase.reveal => _buildCard(context),
      },
    );
  }

  Widget _buildCard(BuildContext context) {
    final theme = Theme.of(context);
    final session = _session!;
    final entry = session.current!;
    final item = session.currentItem!;
    final revealed = _phase == _Phase.reveal;
    final now = ref.read(clockProvider).now();
    final previews =
        revealed ? ref.read(schedulerProvider).preview(entry.state, now) : null;
    final score = _matchScore;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        LinearProgressIndicator(value: session.progress),
        Gaps.sm,
        Row(
          children: <Widget>[
            Chip(
              label: Text(item.mode.label),
              visualDensity: VisualDensity.compact,
            ),
            const Spacer(),
            Text(
              '${session.completed} done · ${session.remaining} left',
              style: theme.textTheme.labelMedium,
            ),
          ],
        ),
        Gaps.md,
        Text(
          item.mode.instruction,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Gaps.md,
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                if (item.mode == PracticeMode.listenRepeat && !revealed) ...<Widget>[
                  Row(
                    children: <Widget>[
                      IconButton.filled(
                        tooltip: 'Play',
                        icon: const Icon(Icons.volume_up),
                        onPressed: _canSpeak
                            ? () => _speak(item.spokenText ?? item.expected)
                            : null,
                      ),
                      Gaps.md,
                      Expanded(
                        child: Text(
                          _canSpeak
                              ? 'Listen, then repeat out loud.'
                              : 'Speech is off — say it from the meaning below.',
                          style: theme.textTheme.bodyLarge,
                        ),
                      ),
                    ],
                  ),
                  Gaps.md,
                ],
                Text(
                  item.prompt,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (_showHint && item.hint != null) ...<Widget>[
                  Gaps.sm,
                  Text(
                    'Hint: ${item.hint}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.tertiary,
                    ),
                  ),
                ],
                if (revealed) ...<Widget>[
                  const Divider(height: 32),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          item.expected,
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (_canSpeak)
                        IconButton(
                          tooltip: 'Listen',
                          icon: const Icon(Icons.volume_up_outlined),
                          onPressed: () => _speak(item.expected),
                        ),
                    ],
                  ),
                  if (entry.chunk.meaning.isNotEmpty &&
                      item.mode != PracticeMode.l1ToL2) ...<Widget>[
                    Gaps.xs,
                    Text(
                      entry.chunk.meaning,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  if (score != null) ...<Widget>[
                    Gaps.sm,
                    Text(
                      AnswerMatcher.isCorrect(score)
                          ? 'Match ${(score * 100).round()}% — nice.'
                          : 'Match ${(score * 100).round()}% — compare and say it again.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AnswerMatcher.isCorrect(score)
                            ? theme.colorScheme.primary
                            : theme.colorScheme.error,
                      ),
                    ),
                    if (_transcript != null)
                      Text(
                        'You typed: $_transcript',
                        style: theme.textTheme.bodySmall,
                      ),
                  ],
                ],
              ],
            ),
          ),
        ),
        Gaps.md,
        if (!revealed) ...<Widget>[
          TextField(
            controller: _typed,
            decoration: AppTheme.input(
              'Type it (optional) — or just say it',
              hint: 'Typing gives you a match score',
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _reveal(),
          ),
          Gaps.sm,
          FilledButton.icon(
            onPressed: _reveal,
            icon: const Icon(Icons.visibility_outlined),
            label: const Text('I said it — reveal'),
          ),
          if (item.hint != null && !_showHint) ...<Widget>[
            Gaps.xs,
            TextButton(
              onPressed: () => setState(() {
                _showHint = true;
                _usedHint = true;
              }),
              child: const Text('Show a hint'),
            ),
          ],
        ] else ...<Widget>[
          Text(
            'How well did you recall it?',
            style: theme.textTheme.titleSmall,
            textAlign: TextAlign.center,
          ),
          Gaps.sm,
          Row(
            children: <Widget>[
              for (final rating in ReviewRating.values) ...<Widget>[
                Expanded(
                  child: _GradeButton(
                    rating: rating,
                    interval: previews == null
                        ? ''
                        : formatInterval(previews[rating]!.difference(now)),
                    enabled: !_grading,
                    onPressed: () => _grade(rating),
                  ),
                ),
                if (rating != ReviewRating.easy) Gaps.sm,
              ],
            ],
          ),
        ],
      ],
    );
  }
}

class _GradeButton extends StatelessWidget {
  const _GradeButton({
    required this.rating,
    required this.interval,
    required this.enabled,
    required this.onPressed,
  });

  final ReviewRating rating;
  final String interval;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = switch (rating) {
      ReviewRating.forgot => scheme.error,
      ReviewRating.hard => scheme.tertiary,
      ReviewRating.good => scheme.primary,
      ReviewRating.easy => scheme.secondary,
    };
    return OutlinedButton(
      onPressed: enabled ? onPressed : null,
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        minimumSize: const Size.fromHeight(56),
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

class _Summary extends StatelessWidget {
  const _Summary({
    required this.session,
    required this.onMore,
    required this.onDone,
  });

  final PracticeSession session;
  final VoidCallback onMore;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Icon(Icons.celebration_outlined, size: 56, color: theme.colorScheme.primary),
          Gaps.md,
          Text('Session complete', style: theme.textTheme.headlineSmall),
          Gaps.sm,
          Text(
            '${session.completed} recalls across ${session.initialCount} chunks',
            textAlign: TextAlign.center,
          ),
          Gaps.lg,
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: <Widget>[
              for (final rating in ReviewRating.values)
                Chip(
                  label: Text('${rating.label}: ${session.ratings[rating] ?? 0}'),
                ),
            ],
          ),
          Gaps.xl,
          FilledButton(onPressed: onMore, child: const Text('Practice more')),
          Gaps.sm,
          OutlinedButton(onPressed: onDone, child: const Text('Done')),
        ],
      ),
    );
  }
}
