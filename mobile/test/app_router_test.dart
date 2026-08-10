import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:opensen/core/routing/app_router.dart';

void main() {
  testWidgets('resolves each primary route inside the shell', (
    WidgetTester tester,
  ) async {
    for (final location in [
      AppRoutes.situationBuilder,
      AppRoutes.chunkLibrary,
      AppRoutes.recallPractice,
    ]) {
      final router = GoRouter(
        initialLocation: location,
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) {
              return Scaffold(body: navigationShell);
            },
            branches: [
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoutes.situationBuilder,
                    builder: (context, state) =>
                        const Text('Situation Builder route'),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoutes.chunkLibrary,
                    builder: (context, state) =>
                        const Text('Chunk Library route'),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoutes.recallPractice,
                    builder: (context, state) =>
                        const Text('Recall Practice route'),
                  ),
                ],
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      expect(router.state.matchedLocation, location);
    }
  });

  test('app router provider exposes configured primary paths', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final router = container.read(appRouterProvider);

    expect(router.configuration.routes, isNotEmpty);
    expect(AppRoutes.situationBuilder, '/situations');
    expect(AppRoutes.chunkLibrary, '/chunks');
    expect(AppRoutes.recallPractice, '/practice');
  });
}
