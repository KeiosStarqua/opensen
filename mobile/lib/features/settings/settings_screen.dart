import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../domain/entities/learner_settings.dart';
import '../chunks/chunk_providers.dart';
import '../practice/practice_providers.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final controller = ref.read(settingsProvider.notifier);
    final speech = ref.watch(speechSynthesizerProvider);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: <Widget>[
          const SectionHeader('Practice'),
          ListTile(
            title: const Text('New chunks per day'),
            subtitle: Text('${settings.dailyNewLimit}'),
            trailing: SizedBox(
              width: 200,
              child: Slider(
                value: settings.dailyNewLimit.toDouble(),
                min: 0,
                max: 40,
                divisions: 40,
                label: '${settings.dailyNewLimit}',
                onChanged: (value) => controller.update(
                  (s) => s.copyWith(dailyNewLimit: value.round()),
                ),
              ),
            ),
          ),
          ListTile(
            title: const Text('Chunks per session'),
            subtitle: Text('${settings.sessionSize}'),
            trailing: SizedBox(
              width: 200,
              child: Slider(
                value: settings.sessionSize.toDouble(),
                min: 5,
                max: 50,
                divisions: 9,
                label: '${settings.sessionSize}',
                onChanged: (value) => controller.update(
                  (s) => s.copyWith(sessionSize: value.round()),
                ),
              ),
            ),
          ),
          ListTile(
            title: const Text('Target retention'),
            subtitle: Text(
              '${(settings.desiredRetention * 100).round()}% — higher means '
              'more frequent reviews',
            ),
            trailing: SizedBox(
              width: 200,
              child: Slider(
                value: settings.desiredRetention,
                min: 0.75,
                max: 0.97,
                divisions: 22,
                label: '${(settings.desiredRetention * 100).round()}%',
                onChanged: (value) => controller.update(
                  (s) => s.copyWith(
                    desiredRetention: double.parse(value.toStringAsFixed(2)),
                  ),
                ),
              ),
            ),
          ),
          const SectionHeader('Speech'),
          SwitchListTile(
            title: const Text('Read sentences aloud'),
            subtitle: Text(
              speech.isAvailable
                  ? 'Uses the system voice, works offline'
                  : 'No speech engine available on this device',
            ),
            value: settings.ttsEnabled && speech.isAvailable,
            onChanged: speech.isAvailable
                ? (value) => controller.update((s) => s.copyWith(ttsEnabled: value))
                : null,
          ),
          ListTile(
            enabled: settings.ttsEnabled && speech.isAvailable,
            title: const Text('Speech rate'),
            subtitle: Text(settings.speechRate.toStringAsFixed(2)),
            trailing: SizedBox(
              width: 200,
              child: Slider(
                value: settings.speechRate,
                min: 0.2,
                max: 0.8,
                divisions: 12,
                onChanged: settings.ttsEnabled && speech.isAvailable
                    ? (value) => controller.update(
                          (s) => s.copyWith(
                            speechRate: double.parse(value.toStringAsFixed(2)),
                          ),
                        )
                    : null,
                onChangeEnd: (value) => speech.speak(
                  'Could you tell me more about the program?',
                  rate: value,
                ),
              ),
            ),
          ),
          const SectionHeader('Appearance'),
          ListTile(
            title: const Text('Theme'),
            trailing: SegmentedButton<AppThemeMode>(
              segments: <ButtonSegment<AppThemeMode>>[
                for (final mode in AppThemeMode.values)
                  ButtonSegment<AppThemeMode>(
                    value: mode,
                    label: Text(mode.label),
                  ),
              ],
              selected: <AppThemeMode>{settings.themeMode},
              onSelectionChanged: (selection) => controller.update(
                (s) => s.copyWith(themeMode: selection.first),
              ),
            ),
          ),
          const SectionHeader('Data'),
          ListTile(
            leading: Icon(Icons.restart_alt, color: theme.colorScheme.error),
            title: const Text('Reset practice progress'),
            subtitle: const Text(
              'Clears scheduling state and review history. Your sentences stay.',
            ),
            onTap: () => _resetProgress(context, ref),
          ),
          ListTile(
            leading: const Icon(Icons.replay_outlined),
            title: const Text('Redo onboarding'),
            onTap: () => controller.update(
              (s) => s.copyWith(onboardingComplete: false),
            ),
          ),
          const SectionHeader('About'),
          const ListTile(
            title: Text('OpenSen'),
            subtitle: Text(
              'Situation → Sentence → Slot → Speak. Fully offline: your '
              'content and progress never leave this device.',
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _resetProgress(BuildContext context, WidgetRef ref) async {
    final ok = await confirm(
      context,
      title: 'Reset practice progress?',
      message: 'All FSRS state, review history and attempts will be deleted.',
      confirmLabel: 'Reset',
    );
    if (!ok) return;
    await ref.read(practiceRepositoryProvider).resetProgress();
    invalidatePracticeViews(ref);
    invalidateChunkViews(ref);
    ref.invalidate(enrolledChunkIdsProvider);
    if (context.mounted) showSnack(context, 'Progress reset');
  }
}
