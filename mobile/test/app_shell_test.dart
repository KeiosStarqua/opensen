import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:opensen/app.dart';

Finder navigationDestination(String label) => find.descendant(
  of: find.byType(NavigationBar),
  matching: find.text(label),
);

void main() {
  testWidgets('launches into Situation Builder with shell navigation', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    expect(find.text('Situation Builder'), findsWidgets);
    expect(
      find.text(
        'Describe a real conversation you need. Situation Builder will turn it into memorization-ready dialogues.',
      ),
      findsOneWidget,
    );
    expect(find.byType(NavigationBar), findsOneWidget);
  });

  testWidgets('selecting Chunk Library updates the visible destination', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    await tester.tap(navigationDestination('Chunk Library'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Browse high-frequency native phrases with swap patterns. Your saved chunks will appear here.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('selecting Recall Practice updates the visible destination', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    await tester.tap(navigationDestination('Recall Practice'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Produce sentences from memory instead of recognizing them. Scheduled recall sessions will start here.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('retains the navigation shell when switching tabs', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    await tester.tap(navigationDestination('Chunk Library'));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsOneWidget);

    await tester.tap(navigationDestination('Recall Practice'));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsOneWidget);

    await tester.tap(navigationDestination('Situation Builder'));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
