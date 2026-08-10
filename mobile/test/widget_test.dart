import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:opensen/app.dart';

Finder navigationDestination(String label) => find.descendant(
  of: find.byType(NavigationBar),
  matching: find.text(label),
);

void main() {
  testWidgets('application baseline renders all primary destinations', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: OpenSenApp()));
    await tester.pumpAndSettle();

    for (final label in [
      'Situation Builder',
      'Chunk Library',
      'Recall Practice',
    ]) {
      await tester.tap(navigationDestination(label));
      await tester.pumpAndSettle();
      expect(find.text(label), findsWidgets);
    }

    expect(find.text('Flutter Demo'), findsNothing);
    expect(find.text('0'), findsNothing);
    expect(find.byIcon(Icons.add), findsNothing);
  });
}
