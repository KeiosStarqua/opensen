import '../../domain/entities/saved_sentence.dart';
import '../../domain/repositories/saved_sentence_repository.dart';
import 'api_client.dart';

/// Saved sentences on the OpenSen API, scoped by the bearer token.
class HttpSavedSentenceRepository implements SavedSentenceRepository {
  HttpSavedSentenceRepository(this._client);

  final OpenSenApiClient _client;

  @override
  Future<SavedSentence> save(String text) async {
    final body = await _guard(
      () => _client.postJson('/api/saved-sentences', <String, String>{
        'text': text,
      }),
    );
    return _sentence(body);
  }

  @override
  Future<List<SavedSentence>> list() async {
    final body = await _guard(() => _client.getJson('/api/saved-sentences'));
    if (body is! Map || body['items'] is! List) {
      throw const ApiException(ApiErrorKind.parse, 'Response is not a list');
    }
    return [
      for (final item in body['items'] as List) _sentence(item),
    ];
  }

  @override
  Future<SavedSentence?> getById(String id) async {
    try {
      final body = await _guard(
        () => _client.getJson('/api/saved-sentences/$id'),
      );
      return _sentence(body);
    } on ApiException catch (error) {
      if (error.status == 404) return null;
      rethrow;
    }
  }

  @override
  Future<SavedSentence?> update(String id, String text) async {
    try {
      final body = await _guard(
        () => _client.patchJson('/api/saved-sentences/$id', <String, String>{
          'text': text,
        }),
      );
      return _sentence(body);
    } on ApiException catch (error) {
      if (error.status == 404) return null;
      rethrow;
    }
  }

  Future<Object?> _guard(Future<Object?> Function() call) async {
    try {
      return await call();
    } on ApiException catch (error) {
      if (error.status == 401) throw const SavedSentenceAccessException();
      rethrow;
    }
  }

  SavedSentence _sentence(Object? body) {
    if (body is! Map || body['id'] is! String || body['text'] is! String) {
      throw const ApiException(
        ApiErrorKind.parse,
        'Response is not a saved sentence',
      );
    }
    final createdAt = DateTime.tryParse(body['createdAt'] as String? ?? '');
    if (createdAt == null) {
      throw const ApiException(ApiErrorKind.parse, 'Missing createdAt');
    }
    return SavedSentence(
      id: body['id'] as String,
      text: body['text'] as String,
      createdAt: createdAt,
    );
  }
}
