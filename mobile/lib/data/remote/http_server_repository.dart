import '../../domain/entities/server_status.dart';
import '../../domain/repositories/server_repository.dart';
import 'api_client.dart';

/// Probes `/health` (is the API up?) and `/api/situations` (is content
/// served?) on the OpenSen backend.
class HttpServerRepository implements ServerRepository {
  HttpServerRepository(this._client);

  final OpenSenApiClient _client;

  @override
  String get baseUrl => _client.baseUri.toString();

  @override
  Future<ServerStatus> checkStatus() async {
    try {
      final health = await _client.getJson('/health');
      if (health is! Map || health['ok'] != true) {
        return const ServerStatus(
          reachable: false,
          contentAvailable: false,
          problem: 'Health check did not report ok',
        );
      }
    } on ApiException catch (error) {
      return ServerStatus(
        reachable: false,
        contentAvailable: false,
        problem: _describe(error),
      );
    }

    try {
      final page = await _client.getJson(
        '/api/situations',
        query: const <String, String>{'limit': '1'},
      );
      if (page is! Map || page['items'] is! List) {
        return const ServerStatus(
          reachable: true,
          contentAvailable: false,
          problem: 'Unexpected content response',
        );
      }
      return const ServerStatus(reachable: true, contentAvailable: true);
    } on ApiException catch (error) {
      return ServerStatus(
        reachable: true,
        contentAvailable: false,
        problem: 'Content: ${_describe(error)}',
      );
    }
  }

  static String _describe(ApiException error) => switch (error.kind) {
    ApiErrorKind.http => '${error.status} ${error.message}',
    ApiErrorKind.network => 'No connection',
    ApiErrorKind.parse => error.message,
  };
}
