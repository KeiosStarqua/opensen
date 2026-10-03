import 'package:flutter/widgets.dart';

/// Phosphor glyphs. `phosphor_flutter` 2.1.0 subclasses [IconData], which is
/// final on the current Flutter SDK, so these code points use the bundled
/// Phosphor fonts directly. Regular is the default; fill is the selected state.
class PhosphorIconsRegular {
  const PhosphorIconsRegular._();

  static const IconData quotes = IconData(0xe660, fontFamily: 'PhosphorRegular');
  static const IconData caretRight = IconData(
    0xe13a,
    fontFamily: 'PhosphorRegular',
  );
  static const IconData speakerHigh = IconData(
    0xe44a,
    fontFamily: 'PhosphorRegular',
  );
}

class PhosphorIconsFill {
  const PhosphorIconsFill._();

  static const IconData quotes = IconData(0xe660, fontFamily: 'PhosphorFill');
  static const IconData caretRight = IconData(0xe13a, fontFamily: 'PhosphorFill');
  static const IconData speakerHigh = IconData(
    0xe44a,
    fontFamily: 'PhosphorFill',
  );
}

class PhosphorIcon extends StatelessWidget {
  const PhosphorIcon(this.icon, {super.key, this.size});

  final IconData icon;
  final double? size;

  @override
  Widget build(BuildContext context) => Icon(icon, size: size);
}
