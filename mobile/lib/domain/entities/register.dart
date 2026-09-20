/// Formality of a chunk or pattern. Decides whether a frame fits a professor
/// or a friend.
enum Register {
  casual('casual', 'Casual'),
  neutral('neutral', 'Neutral'),
  polite('polite', 'Polite'),
  formal('formal', 'Formal');

  const Register(this.key, this.label);

  /// Stable storage key shared with the seed content and the backend API.
  final String key;
  final String label;

  static Register fromKey(String? key) => Register.values.firstWhere(
        (register) => register.key == key,
        orElse: () => Register.neutral,
      );
}

/// CEFR levels used for ordering and filtering content.
const List<String> cefrLevels = <String>['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/// Index of [level] in [cefrLevels]; unknown levels sort after known ones.
int cefrRank(String level) {
  final index = cefrLevels.indexOf(level.toUpperCase());
  return index < 0 ? cefrLevels.length : index;
}
