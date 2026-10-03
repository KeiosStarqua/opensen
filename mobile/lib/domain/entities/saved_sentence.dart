/// A sentence one learner kept, exactly as they entered it.
class SavedSentence {
  const SavedSentence({
    required this.id,
    required this.text,
    required this.createdAt,
  });

  final String id;
  final String text;
  final DateTime createdAt;
}
