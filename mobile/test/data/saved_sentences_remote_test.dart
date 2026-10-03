import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:opensen/data/remote/api_client.dart';
import 'package:opensen/data/remote/http_saved_sentence_repository.dart';
import 'package:opensen/data/remote/neon_auth_gateway.dart';
import 'package:opensen/domain/repositories/account_gateway.dart';
import 'package:opensen/domain/repositories/saved_sentence_repository.dart';

void main() {
  test('sends the bearer token and keeps only this account’s payload', () async {
    late http.Request captured;
    final client = OpenSenApiClient(
      baseUri: Uri.parse('https://api.example.com/'),
      accessToken: () async => 'learner-a',
      httpClient: MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode(<String, Object>{
            'items': <Object>[
              <String, String>{
                'id': 's1',
                'text': 'Could you say that again?',
                'createdAt': '2026-10-03T12:00:00.000Z',
              },
            ],
          }),
          200,
        );
      }),
    );

    final items = await HttpSavedSentenceRepository(client).list();

    expect(captured.headers['authorization'], 'Bearer learner-a');
    expect(captured.url.path, '/api/saved-sentences');
    expect(items.single.text, 'Could you say that again?');
  });

  test('turns a 401 into an access exception and a 404 into null', () async {
    final denied = HttpSavedSentenceRepository(
      OpenSenApiClient(
        baseUri: Uri.parse('https://api.example.com/'),
        httpClient: MockClient(
          (_) async => http.Response(
            jsonEncode(<String, Object>{'error': 'Sign-in required', 'status': 401}),
            401,
          ),
        ),
      ),
    );
    expect(denied.list(), throwsA(isA<SavedSentenceAccessException>()));

    final missing = HttpSavedSentenceRepository(
      OpenSenApiClient(
        baseUri: Uri.parse('https://api.example.com/'),
        httpClient: MockClient(
          (_) async => http.Response(
            jsonEncode(<String, Object>{
              'error': 'Saved sentence not found',
              'status': 404,
            }),
            404,
          ),
        ),
      ),
    );
    expect(await missing.getById('other'), isNull);
  });

  test('patches the owned sentence and hides a missing row', () async {
    late http.Request captured;
    final client = OpenSenApiClient(
      baseUri: Uri.parse('https://api.example.com/'),
      accessToken: () async => 'learner-a',
      httpClient: MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode(<String, String>{
            'id': 's1',
            'text': 'Could you repeat that?',
            'createdAt': '2026-10-03T12:00:00.000Z',
          }),
          200,
        );
      }),
    );

    final updated = await HttpSavedSentenceRepository(client).update(
      's1',
      'Could you repeat that?',
    );

    expect(captured.method, 'PATCH');
    expect(captured.headers['authorization'], 'Bearer learner-a');
    expect(captured.url.path, '/api/saved-sentences/s1');
    expect(jsonDecode(captured.body), <String, String>{
      'text': 'Could you repeat that?',
    });
    expect(updated?.text, 'Could you repeat that?');

    final missing = HttpSavedSentenceRepository(
      OpenSenApiClient(
        baseUri: Uri.parse('https://api.example.com/'),
        httpClient: MockClient(
          (_) async => http.Response(
            jsonEncode(<String, Object>{
              'error': 'Saved sentence not found',
              'status': 404,
            }),
            404,
          ),
        ),
      ),
    );
    expect(await missing.update('other', 'Stolen'), isNull);
  });

  test('reads the Neon Auth session token', () async {
    final gateway = NeonAuthGateway(
      baseUri: Uri.parse('https://auth.example/'),
      httpClient: MockClient((request) async {
        expect(request.url.path, '/sign-in/email');
        return http.Response(
          jsonEncode(<String, String>{'token': 'jwt-1'}),
          200,
        );
      }),
    );

    expect(
      await gateway.signIn(email: 'a@example.com', password: 'secret'),
      'jwt-1',
    );
  });

  test('refuses sign-in when the auth URL is unset', () async {
    final gateway = NeonAuthGateway(baseUri: Uri.parse(''));
    expect(
      () => gateway.signIn(email: 'a@example.com', password: 'secret'),
      throwsA(isA<AccountSignInException>()),
    );
  });
}
