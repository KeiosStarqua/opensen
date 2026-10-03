import '../entities/saved_sentence.dart';
import '../repositories/saved_sentence_repository.dart';
import 'save_heard_sentence.dart';

/// Replaces the wording of a sentence this account already kept.
/// Does not schedule a review. The study step reads the stored text.
class EditHeardSentence {
  const EditHeardSentence(this._sentences);

  final SavedSentenceRepository _sentences;

  Future<SavedSentence> call({required String id, required String raw}) async {
    final text = raw.trim();
    if (text.isEmpty || text.length > SaveHeardSentence.maxLength) {
      throw const FormatException(
        'Enter one sentence, up to 500 characters.',
      );
    }
    final updated = await _sentences.update(id, text);
    if (updated == null) {
      throw const SavedSentenceNotFoundException();
    }
    return updated;
  }
}
