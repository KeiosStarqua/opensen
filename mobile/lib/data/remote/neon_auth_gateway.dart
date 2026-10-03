import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../domain/repositories/account_gateway.dart';

/// Email sign-in against Neon Auth (Better Auth). Returns the session token
/// the API accepts as `Authorization: Bearer`.
class NeonAuthGateway implements AccountGateway {
  NeonAuthGateway({
    required this.baseUri,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  final Uri baseUri;
  final http.Client _http;

  @override
  Future<String> signIn({
    required String email,
    required String password,
  }) async {
    if (baseUri.toString().isEmpty || baseUri.host.isEmpty) {
      throw const AccountSignInException(
        'Sign-in is not configured on this build.',
      );
    }
    final http.Response response;
    try {
      response = await _http.post(
        baseUri.resolve('sign-in/email'),
        headers: const <String, String>{
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(<String, String>{
          'email': email.trim(),
          'password': password,
        }),
      );
    } catch (error) {
      throw AccountSignInException(error.toString());
    }

    final headerToken = response.headers['set-auth-token'];
    Object? body;
    try {
      body = response.body.isEmpty ? null : jsonDecode(response.body);
    } on FormatException {
      body = null;
    }
    final bodyToken = body is Map && body['token'] is String
        ? body['token'] as String
        : null;
    final token = (headerToken != null && headerToken.isNotEmpty)
        ? headerToken
        : bodyToken;
    if (response.statusCode >= 200 &&
        response.statusCode < 300 &&
        token != null &&
        token.isNotEmpty) {
      return token;
    }
    final message = body is Map && body['message'] is String
        ? body['message'] as String
        : 'Could not sign in.';
    throw AccountSignInException(message);
  }

  void close() => _http.close();
}
