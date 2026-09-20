import 'dart:math' as math;

/// Compares what the learner produced with the expected chunk.
///
/// Speech-to-text style matching: case, punctuation and spacing are ignored
/// and similarity is `1 - normalisedLevenshtein`.
class AnswerMatcher {
  const AnswerMatcher._();

  /// Similarity at or above which an answer counts as correct.
  static const double correctThreshold = 0.85;

  static final RegExp _nonWord = RegExp(r"[^a-z0-9' ]+");
  static final RegExp _spaces = RegExp(r'\s+');

  static String normalize(String text) => text
      .toLowerCase()
      .replaceAll('’', "'")
      .replaceAll(_nonWord, ' ')
      .replaceAll(_spaces, ' ')
      .trim();

  /// 1.0 for an exact (normalised) match, 0.0 for nothing in common.
  static double similarity(String expected, String actual) {
    final a = normalize(expected);
    final b = normalize(actual);
    if (a.isEmpty && b.isEmpty) return 1;
    if (a.isEmpty || b.isEmpty) return 0;
    final distance = levenshtein(a, b);
    final longest = math.max(a.length, b.length);
    return 1 - distance / longest;
  }

  static bool isCorrect(double score) => score >= correctThreshold;

  static int levenshtein(String a, String b) {
    if (a == b) return 0;
    if (a.isEmpty) return b.length;
    if (b.isEmpty) return a.length;
    var previous = List<int>.generate(b.length + 1, (index) => index);
    var current = List<int>.filled(b.length + 1, 0);
    for (var i = 1; i <= a.length; i++) {
      current[0] = i;
      for (var j = 1; j <= b.length; j++) {
        final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
        current[j] = math.min(
          math.min(current[j - 1] + 1, previous[j] + 1),
          previous[j - 1] + cost,
        );
      }
      final swap = previous;
      previous = current;
      current = swap;
    }
    return previous[b.length];
  }
}
