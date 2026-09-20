import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/platform/speech_synthesizer.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/dialogue.dart';
import '../shared/widgets.dart';
import 'situation_providers.dart';

/// A dialogue as chat bubbles, its chunks, and the shortest path into
/// practice: add all chunks and start a session.
class DialogueScreen extends ConsumerStatefulWidget {
  const DialogueScreen({super.key, required this.dialogueId});

  final String dialogueId;

  @override
  ConsumerState<DialogueScreen> createState() => _DialogueScreenState();
}

class _DialogueScreenState extends ConsumerState<DialogueScreen> {
  late final SpeechSynthesizer _speech;
  bool _playingAll = false;

  @override
  void initState() {
    super.initState();
    _speech = ref.read(speechSynthesizerProvider);
  }

  @override
  void dispose() {
    _speech.stop();
    super.dispose();
  }

  Future<void> _speak(String text) async {
    final settings = ref.read(settingsProvider);
    if (!settings.ttsEnabled) return;
    await _speech.speak(text, rate: settings.speechRate);
  }

  Future<void> _playAll(Dialogue dialogue) async {
    if (_playingAll) {
      await _speech.stop();
      setState(() => _playingAll = false);
      return;
    }
    setState(() => _playingAll = true);
    for (final line in dialogue.lines) {
      if (!mounted || !_playingAll) break;
      await _speak(line.text);
    }
    if (mounted) setState(() => _playingAll = false);
  }

  Future<void> _enroll(DialogueView view, {bool thenPractice = false}) async {
    final ids = view.chunks.map((chunk) => chunk.id).toList();
    if (ids.isNotEmpty) {
      await ref.read(practiceRepositoryProvider).enroll(
            ids,
            ref.read(clockProvider).now(),
          );
      ref.invalidate(enrolledChunkIdsProvider);
      ref.invalidate(dialogueViewProvider(widget.dialogueId));
    }
    if (!mounted) return;
    if (thenPractice) {
      context.push(AppRoutes.practiceSession);
    } else {
      showSnack(context, 'Added ${ids.length} chunks to your plan');
    }
  }

  Future<void> _delete(DialogueView view) async {
    final ok = await confirm(
      context,
      title: 'Delete this dialogue?',
      message: 'Your chunks and practice progress are kept.',
    );
    if (!ok || !mounted) return;
    await ref.read(contentRepositoryProvider).deleteDialogue(view.dialogue.id);
    ref.invalidate(myDialoguesProvider);
    if (!mounted) return;
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final view = ref.watch(dialogueViewProvider(widget.dialogueId));
    final ttsAvailable = ref.watch(speechSynthesizerProvider).isAvailable &&
        ref.watch(settingsProvider.select((s) => s.ttsEnabled));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dialogue'),
        actions: <Widget>[
          if (view.asData?.value?.dialogue.isTemplate == false)
            IconButton(
              tooltip: 'Delete',
              icon: const Icon(Icons.delete_outline),
              onPressed: () {
                final data = view.asData?.value;
                if (data != null) _delete(data);
              },
            ),
        ],
      ),
      body: AsyncValueView<DialogueView?>(
        value: view,
        onRetry: () => ref.invalidate(dialogueViewProvider(widget.dialogueId)),
        builder: (data) {
          if (data == null) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Dialogue not found',
              message: 'It may have been deleted.',
            );
          }
          final theme = Theme.of(context);
          final dialogue = data.dialogue;
          final situation = data.situation;
          final now = ref.read(clockProvider).now();
          final unenrolled = data.unenrolledChunks.length;
          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      dialogue.title,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (situation != null) ...<Widget>[
                      Gaps.xs,
                      Text(
                        '${situation.roleSelf} ↔ ${situation.roleOther} · '
                        '${situation.tone.label} · Level ${dialogue.level}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                    if (ttsAvailable) ...<Widget>[
                      Gaps.md,
                      OutlinedButton.icon(
                        onPressed: () => _playAll(dialogue),
                        icon: Icon(_playingAll ? Icons.stop : Icons.play_arrow),
                        label: Text(
                          _playingAll ? 'Stop' : 'Listen to the whole dialogue',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              for (final line in dialogue.lines)
                _LineBubble(
                  line: line,
                  speakerLabel: line.speaker == Speaker.self
                      ? (situation?.roleSelf ?? 'You')
                      : (situation?.roleOther ?? 'Them'),
                  chunkTexts: <String>[
                    for (final id in line.chunkIds)
                      if (data.chunksById[id] != null) data.chunksById[id]!.text,
                  ],
                  onSpeak: ttsAvailable ? () => _speak(line.text) : null,
                ),
              SectionHeader(
                'Chunks in this dialogue',
                subtitle: '${data.chunks.length} reusable sentences',
              ),
              for (final chunk in data.chunks)
                ChunkTile(
                  chunk: chunk,
                  state: data.states[chunk.id],
                  now: now,
                  onTap: () => context.push(AppRoutes.chunk(chunk.id)),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: <Widget>[
                    FilledButton.icon(
                      onPressed: data.chunks.isEmpty
                          ? null
                          : () => _enroll(data, thenPractice: true),
                      icon: const Icon(Icons.record_voice_over),
                      label: const Text('Practice these chunks now'),
                    ),
                    Gaps.sm,
                    OutlinedButton.icon(
                      onPressed: unenrolled == 0 ? null : () => _enroll(data),
                      icon: const Icon(Icons.playlist_add),
                      label: Text(
                        unenrolled == 0
                            ? 'All chunks are in your plan'
                            : 'Add $unenrolled chunks to my plan',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _LineBubble extends StatelessWidget {
  const _LineBubble({
    required this.line,
    required this.speakerLabel,
    required this.chunkTexts,
    this.onSpeak,
  });

  final DialogueLine line;
  final String speakerLabel;
  final List<String> chunkTexts;
  final VoidCallback? onSpeak;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final isSelf = line.speaker == Speaker.self;
    return Align(
      alignment: isSelf ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.85,
        ),
        child: Container(
          margin: EdgeInsets.fromLTRB(isSelf ? 48 : 16, 4, isSelf ? 16 : 48, 4),
          padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
          decoration: BoxDecoration(
            color: isSelf ? scheme.primaryContainer : scheme.surfaceContainerHigh,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(isSelf ? 16 : 4),
              bottomRight: Radius.circular(isSelf ? 4 : 16),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      speakerLabel,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: isSelf
                            ? scheme.onPrimaryContainer
                            : scheme.onSurfaceVariant,
                      ),
                    ),
                    Gaps.xs,
                    _HighlightedText(text: line.text, highlights: chunkTexts),
                  ],
                ),
              ),
              if (onSpeak != null)
                IconButton(
                  tooltip: 'Listen',
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.volume_up_outlined, size: 20),
                  onPressed: onSpeak,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Bolds every chunk occurrence inside a line.
class _HighlightedText extends StatelessWidget {
  const _HighlightedText({required this.text, required this.highlights});

  final String text;
  final List<String> highlights;

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).textTheme.bodyLarge;
    final bold = base?.copyWith(fontWeight: FontWeight.w700);
    final spans = <TextSpan>[];
    var cursor = 0;
    final lower = text.toLowerCase();
    while (cursor < text.length) {
      var bestStart = -1;
      var bestLength = 0;
      for (final highlight in highlights) {
        if (highlight.isEmpty) continue;
        final index = lower.indexOf(highlight.toLowerCase(), cursor);
        if (index >= 0 && (bestStart == -1 || index < bestStart)) {
          bestStart = index;
          bestLength = highlight.length;
        }
      }
      if (bestStart == -1) {
        spans.add(TextSpan(text: text.substring(cursor), style: base));
        break;
      }
      if (bestStart > cursor) {
        spans.add(TextSpan(text: text.substring(cursor, bestStart), style: base));
      }
      spans.add(
        TextSpan(
          text: text.substring(bestStart, bestStart + bestLength),
          style: bold,
        ),
      );
      cursor = bestStart + bestLength;
    }
    return Text.rich(TextSpan(children: spans));
  }
}
