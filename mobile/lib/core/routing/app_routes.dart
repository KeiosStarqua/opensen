/// Route locations. Detail screens live outside the shell so they cover the
/// bottom navigation.
class AppRoutes {
  const AppRoutes._();

  static const String onboarding = '/onboarding';

  // Shell branches.
  static const String situations = '/situations';
  static const String library = '/library';
  static const String practice = '/practice';
  static const String plan = '/plan';

  // Detail routes (root navigator).
  static String situation(String id) => '/situations/$id';
  static String buildDialogue(String situationId) =>
      '/situations/$situationId/build';
  static String dialogue(String id) => '/dialogues/$id';
  static const String newChunk = '/chunks/new';
  static String chunk(String id) => '/chunks/$id';
  static String drill(String patternId) => '/drills/$patternId';
  static const String practiceSession = '/practice/session';
  static const String settings = '/settings';
  static const String export = '/export';
}
