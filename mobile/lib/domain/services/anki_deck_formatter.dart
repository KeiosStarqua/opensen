import '../entities/chunk.dart';
import '../entities/sentence_pattern.dart';
import '../entities/situation.dart';

/// One Anki note: meaning on the front, the chunk plus its frame on the back.
class AnkiNote {
  const AnkiNote({
    required this.front,
    required this.back,
    this.tags = const <String>[],
  });

  final String front;
  final String back;
  final List<String> tags;
}

/// Writes Anki's tab-separated import format with header directives, so the
/// file imports with File → Import in Anki 2.1.55+ (HTML on the back, tags
/// in the third column).
class AnkiDeckFormatter {
  const AnkiDeckFormatter();

  static const String fileExtension = 'txt';

  String format(Iterable<AnkiNote> notes) {
    final buffer = StringBuffer()
      ..writeln('#separator:tab')
      ..writeln('#html:true')
      ..writeln('#tags column:3')
      ..writeln('#columns:Front\tBack\tTags');
    for (final note in notes) {
      buffer
        ..write(_escape(note.front))
        ..write('\t')
        ..write(_escape(note.back))
        ..write('\t')
        ..writeln(note.tags.map(slugTag).where((t) => t.isNotEmpty).join(' '));
    }
    return buffer.toString();
  }

  AnkiNote noteForChunk(
    Chunk chunk, {
    SentencePattern? pattern,
    Situation? situation,
  }) {
    final back = StringBuffer('<b>${_html(chunk.text)}</b>');
    if (pattern != null && pattern.hasSlots) {
      back.write('<br><br><i>Frame:</i> ${_html(pattern.frame)}');
      for (final slot in pattern.slots) {
        final variants = slot.validatedVariants.map((v) => _html(v.text));
        if (variants.isNotEmpty) {
          back.write('<br><i>${_html(slot.name)}:</i> ${variants.join(' · ')}');
        }
      }
    }
    if (situation != null) {
      back.write('<br><br><small>${_html(situation.name)}</small>');
    }
    return AnkiNote(
      front: chunk.meaning.isEmpty ? chunk.text : chunk.meaning,
      back: back.toString(),
      tags: <String>[
        'opensen',
        if (situation != null) 'opensen::${situation.name}',
        'register::${chunk.register.key}',
        'level::${chunk.level}',
      ],
    );
  }

  /// Anki tags cannot contain spaces; keep `::` hierarchy separators.
  static String slugTag(String tag) => tag
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9:_-]+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .replaceAll(RegExp(r'^_|_$'), '');

  static String _escape(String value) =>
      value.replaceAll('\t', ' ').replaceAll('\r', '').replaceAll('\n', '<br>');

  static String _html(String value) => value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
}
