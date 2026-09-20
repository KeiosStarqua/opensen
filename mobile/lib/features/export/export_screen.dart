import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/services/anki_deck_formatter.dart';
import '../shared/widgets.dart';

/// Anki Export: pick the scope, share the import file.
class ExportScreen extends ConsumerStatefulWidget {
  const ExportScreen({super.key});

  @override
  ConsumerState<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends ConsumerState<ExportScreen> {
  bool _enrolledOnly = true;
  bool _busy = false;
  int? _lastCount;

  Future<void> _export() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final result = await ref
          .read(exportAnkiUseCaseProvider)
          .call(enrolledOnly: _enrolledOnly);
      if (result.noteCount == 0) {
        if (mounted) showSnack(context, 'Nothing to export yet');
        return;
      }
      final stamp = DateTime.now()
          .toIso8601String()
          .substring(0, 10)
          .replaceAll('-', '');
      await ref.read(exportSinkProvider).deliver(
            fileName: 'opensen-chunks-$stamp.${AnkiDeckFormatter.fileExtension}',
            content: result.content,
            message: 'OpenSen chunks (${result.noteCount} notes). '
                'Import in Anki: File → Import.',
          );
      if (mounted) setState(() => _lastCount = result.noteCount);
    } catch (error) {
      if (mounted) showSnack(context, 'Export failed: $error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Export to Anki')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Take your chunks anywhere.',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          Gaps.sm,
          Text(
            'OpenSen writes a tab-separated file that Anki imports directly '
            '(File → Import). Front: meaning. Back: the sentence, its frame '
            'and every swappable fill. Tags keep the situation.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Gaps.lg,
          Card(
            child: SwitchListTile(
              value: _enrolledOnly,
              title: const Text('Only chunks in my plan'),
              subtitle: Text(
                _enrolledOnly
                    ? 'What you are actively practising'
                    : 'Whole library: every template and personal sentence',
              ),
              onChanged: (value) => setState(() => _enrolledOnly = value),
            ),
          ),
          Gaps.lg,
          FilledButton.icon(
            onPressed: _busy ? null : _export,
            icon: _busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.ios_share),
            label: Text(_busy ? 'Preparing…' : 'Share export file'),
          ),
          if (_lastCount != null) ...<Widget>[
            Gaps.md,
            Text(
              'Last export: $_lastCount notes.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall,
            ),
          ],
          Gaps.xl,
          Text(
            'Anki is where you go when you leave the app. Recall practice and '
            'substitution drills only happen here — export is a backup, not a '
            'replacement.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
