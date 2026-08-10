import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/chunks/presentation/chunk_library_placeholder.dart';
import '../../features/practice/presentation/recall_practice_placeholder.dart';
import '../../features/shell/presentation/app_shell.dart';
import '../../features/situations/presentation/situation_builder_placeholder.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _situationsBranchKey = GlobalKey<NavigatorState>();
final _chunksBranchKey = GlobalKey<NavigatorState>();
final _practiceBranchKey = GlobalKey<NavigatorState>();

/// Stable paths for primary shell destinations.
abstract final class AppRoutes {
  static const situationBuilder = '/situations';
  static const chunkLibrary = '/chunks';
  static const recallPractice = '/practice';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.situationBuilder,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _situationsBranchKey,
            routes: [
              GoRoute(
                path: AppRoutes.situationBuilder,
                builder: (context, state) =>
                    const SituationBuilderPlaceholder(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _chunksBranchKey,
            routes: [
              GoRoute(
                path: AppRoutes.chunkLibrary,
                builder: (context, state) => const ChunkLibraryPlaceholder(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _practiceBranchKey,
            routes: [
              GoRoute(
                path: AppRoutes.recallPractice,
                builder: (context, state) => const RecallPracticePlaceholder(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
