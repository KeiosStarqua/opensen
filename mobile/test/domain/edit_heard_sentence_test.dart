import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/saved_sentence.dart';
import 'package:opensen/domain/repositories/saved_sentence_repository.dart';
import 'package:opensen/domain/usecases/edit_heard_sentence.dart';

class _MemorySentences implements SavedSentenceRepository {
  _MemorySentences(this.items);

  final List<SavedSentence> items;

  @override
  Future<SavedSentence> save(String text) async {
    throw UnimplementedError();
  }

  @override
  Future<List<SavedSentence>> list() async => items;

  @override
  Future<SavedSentence?> getById(String id) async {
    for (final item in items) {
      if (item.id == id) return item;
    }
    return null;
  }

  @override
  Future<SavedSentence?> update(String id, String text) async {
    for (var index = 0; index < items.length; index++) {
      if (items[index].id != id) continue;
      final next = SavedSentence(
        id: id,
        text: text,
        createdAt: items[index].createdAt,
      );
      items[index] = next;
      return next;
    }
    return null;
  }
}

void main() {
  test('replaces the trimmed wording of an owned sentence', () async {
    final store = _MemorySentences(<SavedSentence>[
      SavedSentence(
        id: 's1',
        text: 'Could you say that again?',
        createdAt: DateTime.utc(2026, 10, 3),
      ),
    ]);

    final updated = await EditHeardSentence(store).call(
      id: 's1',
      raw: '  Could you repeat that?  ',
    );

    expect(updated.text, 'Could you repeat that?');
    expect(store.items.single.text, 'Could you repeat that?');
  });

  test('rejects an empty sentence and leaves the stored text', () async {
    final store = _MemorySentences(<SavedSentence>[
      SavedSentence(
        id: 's1',
        text: 'Could you say that again?',
        createdAt: DateTime.utc(2026, 10, 3),
      ),
    ]);

    expect(
      () => EditHeardSentence(store).call(id: 's1', raw: '   '),
      throwsFormatException,
    );
    expect(store.items.single.text, 'Could you say that again?');
  });

  test('rejects an edit when the account does not own the sentence', () async {
    final store = _MemorySentences(<SavedSentence>[]);

    expect(
      () => EditHeardSentence(store).call(id: 'other', raw: 'Stolen'),
      throwsA(isA<SavedSentenceNotFoundException>()),
    );
  });
}
