import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/learner_settings.dart';
import 'package:opensen/features/shell/app_shell.dart';

import '../helpers/fakes.dart';

void main() {
  testWidgets('launches into the Today shell with four destinations',
      (tester) async {
    await pumpApp(tester, TestHarness());

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.byType(AppShell), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Today'), findsWidgets);
    expect(find.text('Library'), findsOneWidget);
    expect(find.text('Situations'), findsOneWidget);
    expect(find.text('Plan'), findsOneWidget);
    expect(find.text('Start with a situation'), findsOneWidget);
    expect(find.text('Flutter Demo'), findsNothing);
  });

  testWidgets('bottom navigation switches between the primary surfaces',
      (tester) async {
    await pumpApp(tester, TestHarness());

    await tester.tap(find.text('Library'));
    await tester.pumpAndSettle();
    expect(find.text('Chunk Library'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'tell me more');
    await tester.pumpAndSettle();
    expect(find.text('Could you tell me more about your research?'), findsOneWidget);

    await tester.tap(find.text('Plan'));
    await tester.pumpAndSettle();
    expect(find.text('Practice Plan'), findsOneWidget);
    expect(find.text('Export to Anki'), findsOneWidget);

    await tester.tap(find.text('Situations'));
    await tester.pumpAndSettle();
    expect(find.text('Meeting a professor'), findsOneWidget);

    await tester.tap(find.text('Today'));
    await tester.pumpAndSettle();
    expect(find.text('Start with a situation'), findsOneWidget);
  });

  testWidgets('shows onboarding first and finishes with Skip', (tester) async {
    final harness = TestHarness(settings: const LearnerSettings());
    await pumpApp(tester, harness);

    expect(find.text('Speak without translating in your head.'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);

    await tester.tap(find.text('Study abroad'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Skip for now'));
    await tester.tap(find.text('Skip for now'));
    await tester.pumpAndSettle();

    expect(find.byType(AppShell), findsOneWidget);
    expect(harness.settingsRepository.settings.onboardingComplete, isTrue);
    expect(harness.settingsRepository.settings.goal, 'study');
  });

  testWidgets(
      'builds a personal dialogue from a situation, practises and grades a chunk',
      (tester) async {
    final harness = TestHarness();
    await pumpApp(tester, harness);

    await tester.tap(find.text('Situations'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Meeting a professor'));
    await tester.tap(find.text('Meeting a professor'));
    await tester.pumpAndSettle();
    expect(find.text('Build my dialogue'), findsOneWidget);
    expect(find.text('Could you tell me more about _____?'), findsOneWidget);

    await tester.tap(find.text('Build my dialogue'));
    await tester.pumpAndSettle();
    expect(find.text('Generate dialogue'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'What are you interested in?'),
      'generative AI',
    );
    await tester.ensureVisible(find.text('Generate dialogue'));
    await tester.tap(find.text('Generate dialogue'));
    await tester.pumpAndSettle();

    expect(find.text('Chunks in this dialogue'), findsOneWidget);
    expect(
      find.textContaining("I'm particularly interested in generative AI."),
      findsWidgets,
    );
    expect(
      harness.content.dialogues.values.where((d) => !d.isTemplate),
      hasLength(1),
    );

    await tester.ensureVisible(find.text('Practice these chunks now'));
    await tester.tap(find.text('Practice these chunks now'));
    await tester.pumpAndSettle();

    expect(harness.practice.states, isNotEmpty);
    expect(find.text('Show answer'), findsOneWidget);

    await tester.tap(find.text('Show answer'));
    await tester.pumpAndSettle();
    expect(find.text('Good'), findsOneWidget);

    await tester.tap(find.text('Good'));
    await tester.pumpAndSettle();
    expect(harness.practice.history, hasLength(1));
    expect(harness.practice.attempts, hasLength(1));
    expect(harness.practice.history.single.chunkId, harness.practice.attempts.single.chunkId);
  });

  testWidgets('substitution drill grades a chosen fill', (tester) async {
    await pumpApp(tester, TestHarness());

    await tester.tap(find.text('Situations'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Meeting a professor'));
    await tester.tap(find.text('Meeting a professor'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Could you tell me more about _____?'));
    await tester.tap(find.text('Could you tell me more about _____?'));
    await tester.pumpAndSettle();

    expect(find.text('Substitution drill'), findsOneWidget);
    expect(find.textContaining('pick the fill'), findsOneWidget);

    await tester.tap(find.byType(OutlinedButton).first);
    await tester.pumpAndSettle();
    expect(find.text('Continue'), findsOneWidget);
    expect(find.textContaining('You said:'), findsOneWidget);
  });
}
