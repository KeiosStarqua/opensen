import 'package:flutter/material.dart';

/// OpenSen Material theme. One seed colour, Material 3 components.
class AppTheme {
  const AppTheme._();

  static const Color seed = Color(0xFF0F766E);

  static ThemeData light() => _build(Brightness.light);

  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);
    return ThemeData(
      colorScheme: scheme,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }

  /// Shared text-field decoration; kept here so forms look alike without
  /// depending on a specific `InputDecorationTheme` API.
  static InputDecoration input(String label, {String? hint, Widget? suffix}) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffix,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        alignLabelWithHint: true,
      );
}

/// Spacing scale used across screens.
class Gaps {
  const Gaps._();

  static const SizedBox xs = SizedBox(height: 4, width: 4);
  static const SizedBox sm = SizedBox(height: 8, width: 8);
  static const SizedBox md = SizedBox(height: 16, width: 16);
  static const SizedBox lg = SizedBox(height: 24, width: 24);
  static const SizedBox xl = SizedBox(height: 32, width: 32);
}
