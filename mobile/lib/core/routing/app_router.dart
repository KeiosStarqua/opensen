import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/chunks/chunk_detail_screen.dart';
import '../../features/chunks/chunk_editor_screen.dart';
import '../../features/chunks/chunk_library_screen.dart';
import '../../features/drills/drill_screen.dart';
import '../../features/export/export_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/plan/plan_screen.dart';
import '../../features/practice/practice_home_screen.dart';
import '../../features/practice/practice_session_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/situations/dialogue_builder_screen.dart';
import '../../features/situations/dialogue_screen.dart';
import '../../features/situations/situation_detail_screen.dart';
import '../../features/situations/situations_screen.dart';
import '../di/providers.dart';
import 'app_routes.dart';

/// Router is created once; onboarding state is read lazily by the redirect
/// so completing onboarding does not rebuild the navigation stack.
final routerProvider = Provider<GoRouter>((ref) {
  final onboarded = ref.read(settingsProvider).onboardingComplete;
  return createAppRouter(
    initialLocation: onboarded ? AppRoutes.situations : AppRoutes.onboarding,
    isOnboarded: () => ref.read(settingsProvider).onboardingComplete,
  );
});

GoRouter createAppRouter({
  required String initialLocation,
  required bool Function() isOnboarded,
}) {
  return GoRouter(
    initialLocation: initialLocation,
    redirect: (context, state) {
      final onboardingRoute = state.matchedLocation == AppRoutes.onboarding;
      if (!isOnboarded() && !onboardingRoute) return AppRoutes.onboarding;
      if (isOnboarded() && onboardingRoute) return AppRoutes.situations;
      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.situations,
                builder: (context, state) => const SituationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.library,
                builder: (context, state) => const ChunkLibraryScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.practice,
                builder: (context, state) => const PracticeHomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.plan,
                builder: (context, state) => const PlanScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/situations/:id',
        builder: (context, state) =>
            SituationDetailScreen(situationId: state.pathParameters['id']!),
        routes: <RouteBase>[
          GoRoute(
            path: 'build',
            builder: (context, state) =>
                DialogueBuilderScreen(situationId: state.pathParameters['id']!),
          ),
        ],
      ),
      GoRoute(
        path: '/dialogues/:id',
        builder: (context, state) =>
            DialogueScreen(dialogueId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.newChunk,
        builder: (context, state) => ChunkEditorScreen(
          situationId: state.uri.queryParameters['situation'],
        ),
      ),
      GoRoute(
        path: '/chunks/:id',
        builder: (context, state) =>
            ChunkDetailScreen(chunkId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/drills/:patternId',
        builder: (context, state) =>
            DrillScreen(patternId: state.pathParameters['patternId']!),
      ),
      GoRoute(
        path: AppRoutes.practiceSession,
        builder: (context, state) => const PracticeSessionScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: AppRoutes.export,
        builder: (context, state) => const ExportScreen(),
      ),
    ],
  );
}
