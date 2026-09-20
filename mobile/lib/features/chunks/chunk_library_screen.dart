import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/chunk.dart';
import '../../domain/entities/practice.dart';
import '../../domain/entities/register.dart';
import '../shared/widgets.dart';
import 'chunk_providers.dart';

/// Chunk Library: search, filter by register, see plan status at a glance.
class ChunkLibraryScreen extends ConsumerStatefulWidget {
  const ChunkLibraryScreen({super.key});

  @override
  ConsumerState<ChunkLibraryScreen> createState() => _ChunkLibraryScreenState();
}

class _ChunkLibraryScreenState extends ConsumerState<ChunkLibraryScreen> {
  final TextEditingController _search = TextEditingController();
  Register? _register;
  bool _onlyMine = false;
  bool _onlyInPlan = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chunks = ref.watch(chunkSearchProvider(_search.text));
    final states = ref.watch(libraryStatesProvider);
    final now = ref.read(clockProvider).now();
    return Scaffold(
      appBar: AppBar(title: const Text('Chunk Library')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.newChunk),
        icon: const Icon(Icons.add),
        label: const Text('My sentence'),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _search,
              decoration: AppTheme.input(
                'Search sentences or meanings',
                suffix: _search.text.isEmpty
                    ? const Icon(Icons.search)
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(_search.clear),
                      ),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          SizedBox(
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              children: <Widget>[
                FilterChip(
                  label: const Text('In my plan'),
                  selected: _onlyInPlan,
                  onSelected: (value) => setState(() => _onlyInPlan = value),
                ),
                Gaps.sm,
                FilterChip(
                  label: const Text('Mine'),
                  selected: _onlyMine,
                  onSelected: (value) => setState(() => _onlyMine = value),
                ),
                Gaps.sm,
                for (final register in Register.values) ...<Widget>[
                  FilterChip(
                    label: Text(register.label),
                    selected: _register == register,
                    onSelected: (value) =>
                        setState(() => _register = value ? register : null),
                  ),
                  Gaps.sm,
                ],
              ],
            ),
          ),
          Expanded(
            child: AsyncValueView<List<Chunk>>(
              value: chunks,
              onRetry: () => ref.invalidate(chunkSearchProvider),
              builder: (all) {
                final stateMap = states.asData?.value ?? const <String, UserChunkState>{};
                final visible = all.where((chunk) {
                  if (_register != null && chunk.register != _register) return false;
                  if (_onlyMine && chunk.isTemplate) return false;
                  if (_onlyInPlan && !stateMap.containsKey(chunk.id)) return false;
                  return true;
                }).toList();
                if (visible.isEmpty) {
                  return EmptyState(
                    icon: Icons.library_books_outlined,
                    title: 'No chunks here yet',
                    message: _search.text.isEmpty && !_onlyMine && !_onlyInPlan
                        ? 'Build a dialogue from a situation to fill your library.'
                        : 'Try a different search or filter.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => invalidateChunkViews(ref),
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: visible.length,
                    itemBuilder: (context, index) {
                      final chunk = visible[index];
                      return ChunkTile(
                        chunk: chunk,
                        state: stateMap[chunk.id],
                        now: now,
                        onTap: () => context.push(AppRoutes.chunk(chunk.id)),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
