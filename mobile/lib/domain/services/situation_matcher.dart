import '../entities/situation.dart';

/// Onboarding helper: ranks situation templates against what the learner
/// typed ("Meeting my professor for the first time") using simple keyword
/// overlap, boosted by the chosen goal category.
class SituationMatcher {
  const SituationMatcher();

  static final RegExp _tokenSplit = RegExp(r'[^a-z0-9]+');
  static const Set<String> _stopWords = <String>{
    'a', 'an', 'the', 'my', 'me', 'i', 'to', 'for', 'of', 'and', 'in', 'on',
    'at', 'with', 'first', 'time', 'soon', 'need', 'want', 'have', 'about',
    'is', 'it', 'be', 'am', 'going', 'this', 'that',
  };

  static const Map<String, List<String>> _synonyms = <String, List<String>>{
    'teacher': <String>['professor'],
    'lecturer': <String>['professor'],
    'university': <String>['professor', 'study'],
    'flight': <String>['airport', 'travel'],
    'plane': <String>['airport', 'travel'],
    'bus': <String>['directions'],
    'metro': <String>['directions'],
    'lost': <String>['directions'],
    'cafe': <String>['restaurant', 'order'],
    'coffee': <String>['restaurant', 'order', 'friends'],
    'eat': <String>['restaurant', 'order'],
    'food': <String>['restaurant', 'order'],
    'menu': <String>['restaurant'],
    'job': <String>['interview', 'work'],
    'hiring': <String>['interview'],
    'recruiter': <String>['interview'],
    'client': <String>['customer', 'call'],
    'phone': <String>['call'],
    'sick': <String>['doctor'],
    'ill': <String>['doctor'],
    'hospital': <String>['doctor'],
    'clinic': <String>['doctor'],
    'pain': <String>['doctor'],
    'hangout': <String>['friends', 'plans'],
    'party': <String>['friends', 'plans'],
    'date': <String>['friends', 'plans'],
    'booking': <String>['hotel', 'reservation'],
    'room': <String>['hotel'],
    'colleague': <String>['small', 'talk', 'work'],
    'coworker': <String>['small', 'talk', 'work'],
    'chat': <String>['small', 'talk'],
  };

  List<Situation> rank(
    Iterable<Situation> templates,
    String query, {
    SituationCategory? preferredCategory,
    int limit = 3,
  }) {
    final tokens = tokenize(query);
    final scored = <MapEntry<Situation, double>>[];
    for (final situation in templates) {
      var score = 0.0;
      final haystack = tokenize(
        '${situation.name} ${situation.description} ${situation.roleOther} '
        '${situation.goal} ${situation.category.label}',
      );
      for (final token in tokens) {
        if (haystack.contains(token)) score += 2;
        for (final expanded in _synonyms[token] ?? const <String>[]) {
          if (haystack.contains(expanded)) score += 1;
        }
      }
      if (preferredCategory != null && situation.category == preferredCategory) {
        score += 1.5;
      }
      if (score > 0) scored.add(MapEntry(situation, score));
    }
    scored.sort((a, b) => b.value.compareTo(a.value));
    return scored.take(limit).map((entry) => entry.key).toList();
  }

  static Set<String> tokenize(String text) => text
      .toLowerCase()
      .split(_tokenSplit)
      .where((token) => token.isNotEmpty && !_stopWords.contains(token))
      .toSet();
}
