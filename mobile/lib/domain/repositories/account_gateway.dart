class AccountSignInException implements Exception {
  const AccountSignInException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Signs the learner into the same account the web app uses.
abstract class AccountGateway {
  Future<String> signIn({required String email, required String password});
}
