import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

/// Why an API call failed.
enum ApiErrorKind {
  /// The server answered with a non-2xx status.
  http,

  /// No answer: offline, DNS, TLS, CORS (web) or timeout.
  network,

  /// The answer was not the JSON we expected.
  parse,
}

class ApiException implements Exception {
  const ApiException(this.kind, this.message, {this.status});

  final ApiErrorKind kind;
  final String message;
  final int? status;

  @override
  String toString() =>
      'ApiException(${kind.name}${status == null ? '' : ' $status'}: $message)';
}

/// Thin JSON transport for the OpenSen Hono API. Every backend call goes
/// through here so base URL, headers, timeouts and error mapping live in one
/// place.
class OpenSenApiClient {
  OpenSenApiClient({
    required this.baseUri,
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 10),
  }) : _http = httpClient ?? http.Client();

  final Uri baseUri;
  final Duration timeout;
  final http.Client _http;

  /// `GET` [path] (e.g. `/api/situations`) and decode the JSON body.
  /// Throws [ApiException] on any failure.
  Future<Object?> getJson(String path, {Map<String, String>? query}) async {
    final uri = baseUri
        .resolve(path)
        .replace(
          queryParameters: query == null || query.isEmpty ? null : query,
        );
    final http.Response response;
    try {
      response = await _http
          .get(
            uri,
            headers: const <String, String>{'Accept': 'application/json'},
          )
          .timeout(timeout);
    } on TimeoutException {
      throw const ApiException(ApiErrorKind.network, 'Request timed out');
    } catch (error) {
      throw ApiException(ApiErrorKind.network, error.toString());
    }

    final ok = response.statusCode >= 200 && response.statusCode < 300;
    Object? body;
    try {
      body = response.body.isEmpty ? null : jsonDecode(response.body);
    } on FormatException {
      if (ok) {
        throw const ApiException(ApiErrorKind.parse, 'Response is not JSON');
      }
    }
    if (!ok) {
      // Backend errors are `{ "error": string, "status": number }`.
      final message = body is Map && body['error'] is String
          ? body['error'] as String
          : 'HTTP ${response.statusCode}';
      throw ApiException(
        ApiErrorKind.http,
        message,
        status: response.statusCode,
      );
    }
    return body;
  }

  void close() => _http.close();
}
