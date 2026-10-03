import '../entities/saved_sentence.dart';
import '../repositories/saved_sentence_repository.dart';

/// Keeps one sentence the learner typed or pasted. Does not look it up in
/// the catalog and does not schedule a review.
class SaveHeardSentence {
  const SaveHeardSentence(this._sentences);

  static const int maxLength = 500;

  final SavedSentenceRepository _sentences;

  Future<SavedSentence> call(String raw) {
    final text = raw.trim();
    if (text.isEmpty || text.length > maxLength) {
      throw const FormatException(
        'Enter one sentence, up to 500 characters.',
      );
    }
    return _sentences.save(text);
  }
}
