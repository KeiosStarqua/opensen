import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/platform/speech_synthesizer.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
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

  Future<void> _close() async {
    final session = _session;
    final midSession = (_phase == _Phase.prompt || _phase == _Phase.reveal) &&
        session != null &&
        session.completed > 0;
    if (!midSession) {
      context.pop();
      return;
    }
    final end = await confirm(
      context,
      title: 'End session?',
      message: 'Graded chunks are already saved.',
      confirmLabel: 'End session',
    );
    if (end && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: switch (_phase) {
          _Phase.loading => const Center(child: CircularProgressIndicator()),
          _Phase.empty => EmptyState(
              icon: _error == null
                  ? Icons.check_circle_outline
                  : Icons.error_outline,
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
          _Phase.prompt || _Phase.reveal => _buildSession(context),
        },
      ),
    );
  }

  /// Prompt and reveal are separate subtrees: the answer does not exist in
  /// the widget tree until the learner commits (design doc §5.4–5.5).
  Widget _buildSession(BuildContext context) {
    final session = _session!;
    final revealed = _phase == _Phase.reveal;
    return Column(
      children: <Widget>[
        SessionHeader(
          progress: session.progress,
          done: session.completed,
          total: session.initialCount,
          onClose: _close,
          trailing: !revealed
              ? TextButton(
                  onPressed: () {
                    session.skip();
                    _startPrompt();
                  },
                  child: const Text('Skip'),
                )
              : null,
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            child: SingleChildScrollView(
              key: ValueKey<_Phase>(_phase),
              padding: const EdgeInsets.all(16),
              child:
                  revealed ? _revealContent(context) : _promptContent(context),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: revealed ? _gradingBar(context) : _promptActions(context),
        ),
      ],
    );
  }

  Widget _promptContent(BuildContext context) {
    final theme = Theme.of(context);
    final item = _session!.currentItem!;
    final blanked = item.mode == PracticeMode.cloze ||
        item.mode == PracticeMode.slotSwap;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Chip(
          label: Text(item.mode.label),
          visualDensity: VisualDensity.compact,
        ),
        Gaps.sm,
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
                if (item.mode == PracticeMode.listenRepeat) ...<Widget>[
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
                if (blanked)
                  SlotBlankText(
                    item.prompt,
                    style: AppText.chunkDisplay(context),
                  )
                else
                  Text(item.prompt, style: AppText.chunkDisplay(context)),
                if (_showHint && item.hint != null) ...<Widget>[
                  Gaps.sm,
                  Text(
                    'Hint: ${item.hint}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.tertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _promptActions(BuildContext context) {
    final item = _session!.currentItem!;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
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
        OutlinedButton.icon(
          onPressed: _reveal,
          icon: const Icon(Icons.visibility_outlined),
          label: const Text('Show answer'),
        ),
        if (item.hint != null && !_showHint)
          TextButton(
            onPressed: () => setState(() {
              _showHint = true;
              _usedHint = true;
            }),
            child: const Text('Show a hint'),
          ),
      ],
    );
  }

  Widget _revealContent(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final entry = _session!.current!;
    final item = _session!.currentItem!;
    final score = _matchScore;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Chip(
          label: Text(item.mode.label),
          visualDensity: VisualDensity.compact,
        ),
        Gaps.md,
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                if (_transcript != null) ...<Widget>[
                  Text(
                    'You typed: $_transcript',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  Gaps.sm,
                ],
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        item.expected,
                        style: AppText.chunkDisplay(context)
                            ?.copyWith(color: scheme.primary),
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
                      color: scheme.onSurfaceVariant,
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
                          ? scheme.primary
                          : scheme.error,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        Gaps.sm,
        Center(
          child: Text(
            'How well did you recall it?',
            style: theme.textTheme.titleSmall,
          ),
        ),
      ],
    );
  }

  Widget _gradingBar(BuildContext context) {
    final entry = _session!.current!;
    final now = ref.read(clockProvider).now();
    final previews = ref.read(schedulerProvider).preview(entry.state, now);
    return GradingBar(
      enabled: !_grading,
      intervals: <ReviewRating, String>{
        for (final rating in ReviewRating.values)
          rating: formatInterval(previews[rating]!.difference(now)),
      },
      onGrade: _grade,
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
          Icon(Icons.check_circle_outline,
              size: 56, color: theme.colorScheme.primary),
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
          FilledButton(onPressed: onDone, child: const Text('Done')),
          Gaps.sm,
          TextButton(onPressed: onMore, child: const Text('Practice more')),
        ],
      ),
    );
  }
}
