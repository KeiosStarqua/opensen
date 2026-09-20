/// Parses and renders frames that mark slots as `{slotName}`.
///
/// Slot names start with a letter and contain letters, digits or underscores.
class SlotTemplate {
  const SlotTemplate._();

  static final RegExp slotPattern = RegExp(r'\{([A-Za-z][A-Za-z0-9_]*)\}');

  /// Placeholder used when a slot is blanked for cloze / drill prompts.
  static const String blankMarker = '_____';

  static bool hasSlots(String template) => slotPattern.hasMatch(template);

  /// Slot names in order of first appearance.
  static List<String> slotNames(String template) {
    final names = <String>[];
    for (final match in slotPattern.allMatches(template)) {
      final name = match.group(1)!;
      if (!names.contains(name)) names.add(name);
    }
    return names;
  }

  /// Replaces every `{slot}` with `fills[slot]`. Unknown slots use
  /// [fallback] (default: the slot name in square brackets).
  static String render(
    String template,
    Map<String, String> fills, {
    String Function(String slot)? fallback,
  }) {
    return template.replaceAllMapped(slotPattern, (match) {
      final name = match.group(1)!;
      final fill = fills[name];
      if (fill != null && fill.isNotEmpty) return fill;
      return fallback == null ? '[$name]' : fallback(name);
    });
  }

  /// Blanks one slot and fills the others with [fills] (or their name).
  static String blank(
    String template,
    String slotName, {
    Map<String, String> fills = const <String, String>{},
    String placeholder = blankMarker,
  }) {
    return template.replaceAllMapped(slotPattern, (match) {
      final name = match.group(1)!;
      if (name == slotName) return placeholder;
      return fills[name] ?? '[$name]';
    });
  }

  /// Blanks every slot.
  static String blankAll(String template, {String placeholder = blankMarker}) =>
      template.replaceAll(slotPattern, placeholder);

  /// Recovers slot fills from a rendered sentence, or null when [text] does
  /// not match the frame. Greedy-minimal matching between literal segments.
  static Map<String, String>? extractFills(String template, String text) {
    final names = slotNames(template);
    if (names.isEmpty) return text == template ? <String, String>{} : null;
    final buffer = StringBuffer('^');
    var last = 0;
    for (final match in slotPattern.allMatches(template)) {
      buffer.write(RegExp.escape(template.substring(last, match.start)));
      buffer.write('(.+?)');
      last = match.end;
    }
    buffer.write(RegExp.escape(template.substring(last)));
    buffer.write(r'$');
    final match = RegExp(buffer.toString(), caseSensitive: false).firstMatch(text);
    if (match == null) return null;
    final fills = <String, String>{};
    var index = 1;
    for (final slotMatch in slotPattern.allMatches(template)) {
      fills[slotMatch.group(1)!] = match.group(index)!.trim();
      index++;
    }
    return fills;
  }
}
