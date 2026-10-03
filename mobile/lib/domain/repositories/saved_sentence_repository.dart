import '../entities/saved_sentence.dart';

/// The caller is signed out, or the token was rejected.
class SavedSentenceAccessException implements Exception {
  const SavedSentenceAccessException();

  @override
  String toString() => 'Sign in to see the sentences on your account.';
}

/// Account-scoped store of sentences the learner heard or read elsewhere.
abstract class SavedSentenceRepository {
  Future<SavedSentence> save(String text);

  Future<List<SavedSentence>> list();

  /// Null when this account does not own [id].
  Future<SavedSentence?> getById(String id);
}
