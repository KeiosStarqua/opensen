import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/saved_sentence.dart';
import 'package:opensen/domain/repositories/saved_sentence_repository.dart';
import 'package:opensen/domain/usecases/save_heard_sentence.dart';

class _MemorySentences implements SavedSentenceRepository {
  final List<SavedSentence> items = <SavedSentence>[];

  @override
  Future<SavedSentence> save(String text) async {
    final sentence = SavedSentence(
      id: 's${items.length + 1}',
      text: text,
      createdAt: DateTime.utc(2026, 10, 3),
    );
    items.add(sentence);
    return sentence;
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
  test('saves the trimmed sentence without a catalog lookup', () async {
    final store = _MemorySentences();
    final kept = await SaveHeardSentence(store).call(
      '  Could you say that again?  ',
    );

    expect(kept.text, 'Could you say that again?');
    expect(store.items.single.text, 'Could you say that again?');
  });

  test('rejects an empty sentence', () async {
    final store = _MemorySentences();
    expect(
      () => SaveHeardSentence(store).call('   '),
      throwsFormatException,
    );
    expect(store.items, isEmpty);
  });
}
