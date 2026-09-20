import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../domain/entities/situation.dart';
import '../../domain/services/situation_matcher.dart';
import '../shared/widgets.dart';
import '../situations/situation_providers.dart';

/// Two questions, then straight into building the first dialogue:
/// "What do you want to speak English for?" → "What conversation do you need
/// soon?" No decks, folders or tags.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final TextEditingController _conversation = TextEditingController();
  SituationCategory? _goal;
  bool _saving = false;

  @override
  void dispose() {
    _conversation.dispose();
    super.dispose();
  }

  Future<void> _finish({Situation? pick}) async {
    if (_saving) return;
    setState(() => _saving = true);
    await ref.read(settingsProvider.notifier).update(
          (settings) => settings.copyWith(
            goal: _goal?.key,
            onboardingComplete: true,
          ),
        );
    if (!mounted) return;
    context.go(AppRoutes.situations);
    if (pick != null) {
      context.push(AppRoutes.buildDialogue(pick.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final templates = ref.watch(situationTemplatesProvider);
    final query = _conversation.text;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: <Widget>[
            Gaps.lg,
            Text(
              'Speak without translating in your head.',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Gaps.sm,
            Text(
              'OpenSen turns the conversations you need into sentence patterns '
              'you can remember, adapt and say automatically.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            Gaps.xl,
            Text(
              'What do you want to speak English for?',
              style: theme.textTheme.titleMedium,
            ),
            Gaps.sm,
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final category in SituationCategory.values)
                  ChoiceChip(
                    label: Text(category.label),
                    selected: _goal == category,
                    onSelected: (selected) =>
                        setState(() => _goal = selected ? category : null),
                  ),
              ],
            ),
            Gaps.xl,
            Text(
              'What conversation do you need soon?',
              style: theme.textTheme.titleMedium,
            ),
            Gaps.sm,
            TextField(
              controller: _conversation,
              decoration: AppTheme.input(
                'Describe it in a few words',
                hint: 'e.g. Meeting my professor for the first time',
              ),
              textInputAction: TextInputAction.search,
              onChanged: (_) => setState(() {}),
            ),
            Gaps.md,
            AsyncValueView<List<Situation>>(
              value: templates,
              builder: (situations) {
                final matches = query.trim().isEmpty
                    ? <Situation>[]
                    : const SituationMatcher().rank(
                        situations,
                        query,
                        preferredCategory: _goal,
                      );
                final suggestions = matches.isNotEmpty
                    ? matches
                    : situations
                        .where((s) => _goal == null || s.category == _goal)
                        .take(3)
                        .toList();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      matches.isNotEmpty
                          ? 'Start with one of these'
                          : 'Popular starting points',
                      style: theme.textTheme.labelLarge,
                    ),
                    Gaps.sm,
                    for (final situation in suggestions)
                      Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(situation.name),
                          subtitle: Text(
                            situation.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: const Icon(Icons.arrow_forward),
                          onTap: _saving ? null : () => _finish(pick: situation),
                        ),
                      ),
                  ],
                );
              },
            ),
            Gaps.lg,
            TextButton(
              onPressed: _saving ? null : () => _finish(),
              child: const Text('Skip for now'),
            ),
          ],
        ),
      ),
    );
  }
}
