import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/practice.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';
import 'chunk_providers.dart';

/// One chunk: text, meaning, its frame with every swappable slot, practice
/// state, and the actions that grow the graph (drill, add, edit, remove).
class ChunkDetailScreen extends ConsumerWidget {
  const ChunkDetailScreen({super.key, required this.chunkId});

  final String chunkId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(chunkDetailProvider(chunkId));
    final settings = ref.watch(settingsProvider);
    final speech = ref.watch(speechSynthesizerProvider);
    final canSpeak = speech.isAvailable && settings.ttsEnabled;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chunk'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Edit meaning',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              final data = detail.asData?.value;
              if (data != null) _editMeaning(context, ref, data);
            },
          ),
        ],
      ),
      body: AsyncValueView<ChunkDetail?>(
        value: detail,
        onRetry: () => ref.invalidate(chunkDetailProvider(chunkId)),
        builder: (data) {
          if (data == null) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Chunk not found',
              message: 'It may have been deleted.',
            );
          }
          final theme = Theme.of(context);
          final chunk = data.chunk;
          final pattern = data.pattern;
          final now = ref.read(clockProvider).now();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Text(
                chunk.text,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              Gaps.sm,
              Text(
                chunk.meaning.isEmpty ? 'No meaning yet — tap edit.' : chunk.meaning,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Gaps.md,
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: <Widget>[
                  RegisterBadge(chunk.register),
                  LevelBadge(chunk.level),
                  Chip(
                    label: Text(chunk.type.label),
                    visualDensity: VisualDensity.compact,
                  ),
                  if (data.situation != null)
                    ActionChip(
                      avatar: const Icon(Icons.explore_outlined, size: 16),
                      label: Text(data.situation!.name),
                      visualDensity: VisualDensity.compact,
                      onPressed: () => context.push(
                        AppRoutes.situation(
                          data.situation!.sourceTemplateId ?? data.situation!.id,
                        ),
                      ),
                    ),
                  if (canSpeak)
                    IconButton.filledTonal(
                      tooltip: 'Listen',
                      icon: const Icon(Icons.volume_up_outlined),
                      onPressed: () =>
                          speech.speak(chunk.text, rate: settings.speechRate),
                    ),
                ],
              ),
              Gaps.lg,
              _PracticeCard(state: data.state, now: now),
              Gaps.md,
              if (data.isEnrolled)
                OutlinedButton.icon(
                  onPressed: () => _unenroll(context, ref, chunk.id),
                  icon: const Icon(Icons.remove_circle_outline),
                  label: const Text('Remove from my plan'),
                )
              else
                FilledButton.icon(
                  onPressed: () => _enroll(context, ref, chunk.id),
                  icon: const Icon(Icons.playlist_add),
                  label: const Text('Add to my plan'),
                ),
              if (pattern != null) ...<Widget>[
                Gaps.lg,
                Text('Frame', style: theme.textTheme.titleMedium),
                Gaps.sm,
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          pattern.frame,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (pattern.meaning.isNotEmpty) ...<Widget>[
                          Gaps.xs,
                          Text(pattern.meaning, style: theme.textTheme.bodySmall),
                        ],
                        for (final slot in pattern.slots) ...<Widget>[
                          Gaps.md,
                          Text(
                            '{${slot.name}}'
                            '${slot.expectedPos == null ? '' : ' · ${slot.expectedPos}'}',
                            style: theme.textTheme.labelLarge,
                          ),
                          Gaps.xs,
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: <Widget>[
                              for (final variant in slot.variants)
                                ActionChip(
                                  label: Text(variant.text),
                                  visualDensity: VisualDensity.compact,
                                  avatar: variant.isValidated
                                      ? null
                                      : const Icon(Icons.person_outline, size: 14),
                                  onPressed: canSpeak
                                      ? () => speech.speak(
                                            pattern.render(<String, String>{
                                              ...chunk.slotFills,
                                              slot.name: variant.text,
                                            }),
                                            rate: settings.speechRate,
                                          )
                                      : null,
                                ),
                            ],
                          ),
                        ],
                        if (pattern.hasSlots) ...<Widget>[
                          Gaps.md,
                          FilledButton.tonalIcon(
                            onPressed: () => context.push(AppRoutes.drill(pattern.id)),
                            icon: const Icon(Icons.swap_horiz),
                            label: const Text('Drill this frame'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
              if (data.siblings.isNotEmpty) ...<Widget>[
                Gaps.lg,
                Text('Same frame, other fills', style: theme.textTheme.titleMedium),
                for (final sibling in data.siblings)
                  ChunkTile(
                    chunk: sibling,
                    onTap: () => context.push(AppRoutes.chunk(sibling.id)),
                  ),
              ],
              if (!chunk.isTemplate) ...<Widget>[
                Gaps.xl,
                TextButton.icon(
                  onPressed: () => _delete(context, ref, chunk.id),
                  icon: Icon(Icons.delete_outline, color: theme.colorScheme.error),
                  label: Text(
                    'Delete this sentence',
                    style: TextStyle(color: theme.colorScheme.error),
                  ),
                ),
              ],
              Gaps.xl,
            ],
          );
        },
      ),
    );
  }

  Future<void> _enroll(BuildContext context, WidgetRef ref, String id) async {
    await ref.read(practiceRepositoryProvider).enroll(
      <String>[id],
      ref.read(clockProvider).now(),
    );
    invalidateChunkViews(ref);
    ref.invalidate(enrolledChunkIdsProvider);
    if (context.mounted) showSnack(context, 'Added to your plan');
  }

  Future<void> _unenroll(BuildContext context, WidgetRef ref, String id) async {
    await ref.read(practiceRepositoryProvider).unenroll(id);
    invalidateChunkViews(ref);
    ref.invalidate(enrolledChunkIdsProvider);
    if (context.mounted) showSnack(context, 'Removed from your plan');
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, String id) async {
    final ok = await confirm(
      context,
      title: 'Delete this sentence?',
      message: 'Its practice history will be deleted too.',
    );
    if (!ok || !context.mounted) return;
    await ref.read(contentRepositoryProvider).deleteChunk(id);
    invalidateChunkViews(ref);
    ref.invalidate(enrolledChunkIdsProvider);
    if (context.mounted) context.pop();
  }

  Future<void> _editMeaning(
    BuildContext context,
    WidgetRef ref,
    ChunkDetail data,
  ) async {
    final controller = TextEditingController(text: data.chunk.meaning);
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Meaning'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          decoration: AppTheme.input(
            'In your own words',
            hint: 'Shown as the prompt in "say it from meaning"',
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (result == null) return;
    await ref
        .read(contentRepositoryProvider)
        .saveChunk(data.chunk.copyWith(meaning: result.trim()));
    invalidateChunkViews(ref);
  }
}

class _PracticeCard extends StatelessWidget {
  const _PracticeCard({required this.state, required this.now});

  final UserChunkState? state;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final current = state;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: current == null
            ? Row(
                children: <Widget>[
                  Icon(Icons.schedule, color: theme.colorScheme.onSurfaceVariant),
                  Gaps.md,
                  const Expanded(
                    child: Text('Not in your practice plan yet.'),
                  ),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      StatusDot(current, now: now),
                      Gaps.sm,
                      Text(current.status.label, style: theme.textTheme.titleSmall),
                      const Spacer(),
                      Text('Due ${formatDue(current.nextReview, now)}'),
                    ],
                  ),
                  Gaps.sm,
                  Text(
                    'Reviews: ${current.reps} · Lapses: ${current.lapses}'
                    '${current.stability == null ? '' : ' · Stability: ${current.stability!.toStringAsFixed(1)} d'}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
