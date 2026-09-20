import 'package:flutter/material.dart';

import '../../domain/entities/practice.dart';

/// Semantic learning-state colours (docs/mobile-ui-design.md §4.1). Always
/// paired with a label or icon — never colour alone.
class StateColors {
  const StateColors._();

  static const Color fresh = Color(0xFF2563EB);
  static const Color learning = Color(0xFFB45309);
  static const Color review = Color(0xFF0F766E); // brand seed
  static const Color mastered = Color(0xFF15803D);
  static const Color lapsed = Color(0xFFB91C1C);

  static const Color freshDark = Color(0xFF93C5FD);
  static const Color learningDark = Color(0xFFFCD34D);
  static const Color reviewDark = Color(0xFF5EEAD4);
  static const Color masteredDark = Color(0xFF86EFAC);
  static const Color lapsedDark = Color(0xFFFCA5A5);

  /// Colour for a grading button (Forgot / Hard / Good / Easy).
  static Color forRating(ReviewRating rating, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    return switch (rating) {
      ReviewRating.forgot => dark ? lapsedDark : lapsed,
      ReviewRating.hard => dark ? learningDark : learning,
      ReviewRating.good => dark ? reviewDark : review,
      ReviewRating.easy => dark ? masteredDark : mastered,
    };
  }

  /// Colour for an FSRS chunk status.
  static Color forStatus(ChunkStatus status, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    return switch (status) {
      ChunkStatus.fresh => dark ? freshDark : fresh,
      ChunkStatus.learning => dark ? learningDark : learning,
      ChunkStatus.review => dark ? reviewDark : review,
      ChunkStatus.relearning => dark ? lapsedDark : lapsed,
    };
  }

  /// Legible text/icon colour on top of [background].
  static Color onColor(Color background) =>
      ThemeData.estimateBrightnessForColor(background) == Brightness.dark
          ? Colors.white
          : Colors.black87;
}

/// Corner radii (design doc §4.4).
class AppRadii {
  const AppRadii._();

  static const double sm = 8;
  static const double md = 12;
  static const double lg = 14;
  static const double xl = 16;
  static const double sheet = 28;
}

/// Learning-text styles (design doc §4.2).
class AppText {
  const AppText._();

  /// The sentence being learned — recall prompts, chunk detail hero.
  static TextStyle? chunkDisplay(BuildContext context) =>
      Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w500,
            height: 36 / 28,
          );

  /// Chunks in lists and dialogue lines.
  static TextStyle? chunkText(BuildContext context) =>
      Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w500,
            height: 30 / 22,
          );
}
