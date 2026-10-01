import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:opensen/data/remote/api_client.dart';
import 'package:opensen/data/remote/http_server_repository.dart';

OpenSenApiClient clientFor(MockClientHandler handler) => OpenSenApiClient(
  baseUri: Uri.parse('https://api.example.com/'),
  httpClient: MockClient(handler),
);

http.Response json(Object body, int status) => http.Response(
  jsonEncode(body),
  status,
  headers: const <String, String>{'content-type': 'application/json'},
);

void main() {
  group('OpenSenApiClient', () {
    test('resolves the path and query against the base URL', () async {
      late Uri requested;
      final client = clientFor((request) async {
        requested = request.url;
        expect(request.headers['Accept'], 'application/json');
        return json(<String, Object>{'items': <Object>[]}, 200);
      });

      final body = await client.getJson(
        '/api/situations',
        query: const <String, String>{'limit': '1'},
      );

      expect(
        requested.toString(),
        'https://api.example.com/api/situations?limit=1',
      );
      expect(body, <String, Object>{'items': <Object>[]});
    });

    test('maps backend error JSON to an http ApiException', () async {
      final client = clientFor(
        (_) async =>
            json(<String, Object>{'error': 'Not found', 'status': 404}, 404),
      );

      await expectLater(
        client.getJson('/api/situations/x'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.kind, 'kind', ApiErrorKind.http)
              .having((e) => e.status, 'status', 404)
              .having((e) => e.message, 'message', 'Not found'),
        ),
      );
    });

    test('non-JSON error bodies still map to http errors', () async {
      final client = clientFor(
        (_) async => http.Response('404 Not Found', 404),
      );

      await expectLater(
        client.getJson('/missing'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.kind, 'kind', ApiErrorKind.http)
              .having((e) => e.message, 'message', 'HTTP 404'),
        ),
      );
    });

    test('a 2xx body that is not JSON is a parse error', () async {
      final client = clientFor((_) async => http.Response('<html>', 200));

      await expectLater(
        client.getJson('/health'),
        throwsA(
          isA<ApiException>().having((e) => e.kind, 'kind', ApiErrorKind.parse),
        ),
      );
    });

    test('transport failures are network errors', () async {
      final client = clientFor(
        (_) async => throw http.ClientException('offline'),
      );

      await expectLater(
        client.getJson('/health'),
        throwsA(
          isA<ApiException>().having(
            (e) => e.kind,
            'kind',
            ApiErrorKind.network,
          ),
        ),
      );
    });
  });

  group('HttpServerRepository', () {
    test('healthy when health and content both answer', () async {
      final repo = HttpServerRepository(
        clientFor((request) async {
          return switch (request.url.path) {
            '/health' => json(<String, Object>{'ok': true}, 200),
            '/api/situations' => json(<String, Object>{
              'items': <Object>[],
            }, 200),
            _ => http.Response('', 404),
          };
        }),
      );

      final status = await repo.checkStatus();

      expect(status.healthy, isTrue);
      expect(status.problem, isNull);
    });

    test('reachable but content unavailable when situations fail', () async {
      final repo = HttpServerRepository(
        clientFor((request) async {
          return request.url.path == '/health'
              ? json(<String, Object>{'ok': true}, 200)
              : json(<String, Object>{
                  'error': 'Internal Server Error',
                  'status': 500,
                }, 500);
        }),
      );

      final status = await repo.checkStatus();

      expect(status.reachable, isTrue);
      expect(status.contentAvailable, isFalse);
      expect(status.problem, 'Content: 500 Internal Server Error');
    });

    test('unreachable when the network fails, without throwing', () async {
      final repo = HttpServerRepository(
        clientFor((_) async => throw http.ClientException('offline')),
      );

      final status = await repo.checkStatus();

      expect(status.reachable, isFalse);
      expect(status.contentAvailable, isFalse);
      expect(status.problem, 'No connection');
    });
  });
}
