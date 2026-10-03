/// The signed-in learner's API token. Stored on device; the sentences live
/// on the account, not in this object.
abstract class LearnerSession {
  Future<String?> readToken();

  Future<void> writeToken(String token);

  Future<void> clear();
}
