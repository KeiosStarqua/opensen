import '../entities/saved_sentence.dart';

/// The caller is signed out, or the token was rejected.
class SavedSentenceAccessException implements Exception {
  const SavedSentenceAccessException();

  @override
  String toString() => 'Sign in to see the sentences on your account.';
}

/// This account does not have that sentence.
class SavedSentenceNotFoundException implements Exception {
  const SavedSentenceNotFoundException();

  @override
  String toString() => 'That sentence is not on this account.';
}

/// Account-scoped store of sentences the learner heard or read elsewhere.
abstract class SavedSentenceRepository {
  Future<SavedSentence> save(String text);

  Future<List<SavedSentence>> list();

  /// Null when this account does not own [id].
  Future<SavedSentence?> getById(String id);

  /// Null when this account does not own [id]. Replaces the stored wording.
  Future<SavedSentence?> update(String id, String text);
}
