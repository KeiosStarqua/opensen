import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:opensen/app.dart';

void main() {
  testWidgets('renders MaterialApp.router with OpenSen identity', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('OpenSen'), findsNothing);
    expect(find.text('Flutter Demo'), findsNothing);
    expect(find.text('You have pushed the button this many times:'), findsNothing);
    expect(find.byIcon(Icons.add), findsNothing);
    expect(find.text('Situation Builder'), findsWidgets);
  });

  testWidgets('supports Riverpod overrides at the composition root', (
    WidgetTester tester,
  ) async {
    const marker = 'override-marker';

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          Provider<String>((ref) => marker),
        ],
        child: Consumer(
          builder: (context, ref, child) {
            final value = ref.watch(Provider<String>((ref) => marker));
            return MaterialApp(home: Scaffold(body: Text(value)));
          },
        ),
      ),
    );

    expect(find.text(marker), findsOneWidget);
  });
}
