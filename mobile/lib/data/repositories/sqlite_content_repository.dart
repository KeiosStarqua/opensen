import 'dart:convert';

import 'package:sqflite_common/sqlite_api.dart';

import '../../domain/entities/chunk.dart';
import '../../domain/entities/dialogue.dart';
import '../../domain/entities/register.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/entities/situation.dart';
import '../../domain/repositories/content_repository.dart';
import '../../domain/services/dialogue_composer.dart';
import '../../domain/services/id_generator.dart';
import '../db/app_database.dart';

class SqliteContentRepository implements ContentRepository {
  SqliteContentRepository(this.db, {required this.ids});

  final Database db;
  final IdGenerator ids;

  // ---------------------------------------------------------------- situations

  @override
  Future<List<Situation>> listSituations({bool? templates}) async {
    final rows = await db.query(
      'situations',
      where: templates == null ? null : 'is_template = ?',
      whereArgs: templates == null ? null : <Object>[templates ? 1 : 0],
      orderBy: 'is_template DESC, created_at DESC, name ASC',
    );
    return rows.map(_situationFromRow).toList();
  }

  @override
  Future<Situation?> getSituation(String id) async {
    final rows = await db.query(
      'situations',
      where: 'id = ?',
      whereArgs: <Object>[id],
      limit: 1,
    );
    return rows.isEmpty ? null : _situationFromRow(rows.first);
  }

  Situation _situationFromRow(Map<String, Object?> row) {
    final promptsRaw = jsonDecode(Rows.text(row['prompts_json'], '[]'));
    return Situation(
      id: row['id'] as String,
      name: Rows.text(row['name']),
      description: Rows.text(row['description']),
      category: SituationCategory.fromKey(row['category'] as String?),
      roleSelf: Rows.text(row['role_self']),
      roleOther: Rows.text(row['role_other']),
      goal: Rows.text(row['goal']),
      tone: Register.fromKey(row['tone'] as String?),
      level: Rows.text(row['level'], 'B1'),
      isTemplate: Rows.boolean(row['is_template']),
      sourceTemplateId: row['source_template_id'] as String?,
      prompts: <SlotPrompt>[
        if (promptsRaw is List)
          for (final item in promptsRaw)
            SlotPrompt.fromJson(item as Map<String, dynamic>),
      ],
      createdAt: Rows.toDate(row['created_at']) ?? DateTime.utc(2026),
    );
  }

  Map<String, Object?> _situationToRow(Situation situation) => <String, Object?>{
        'id': situation.id,
        'name': situation.name,
        'description': situation.description,
        'category': situation.category.key,
        'role_self': situation.roleSelf,
        'role_other': situation.roleOther,
        'goal': situation.goal,
        'tone': situation.tone.key,
        'level': situation.level,
        'is_template': situation.isTemplate ? 1 : 0,
        'source_template_id': situation.sourceTemplateId,
        'prompts_json': jsonEncode(
          situation.prompts.map((p) => p.toJson()).toList(),
        ),
        'created_at': Rows.timestamp(situation.createdAt),
      };

  // ------------------------------------------------------------------ patterns

  @override
  Future<List<SentencePattern>> listPatterns({
    String? situationId,
    Set<String>? ids,
  }) async {
    if (ids != null && ids.isEmpty) return const <SentencePattern>[];
    final List<Map<String, Object?>> rows;
    if (situationId != null) {
      rows = await db.rawQuery(
        '''
        SELECT p.* FROM sentence_patterns p
        INNER JOIN pattern_situations ps ON ps.pattern_id = p.id
        WHERE ps.situation_id = ?
        ORDER BY p.difficulty ASC, p.template ASC
        ''',
        <Object>[situationId],
      );
    } else if (ids != null) {
      rows = await db.query(
        'sentence_patterns',
        where: 'id IN (${_placeholders(ids.length)})',
        whereArgs: ids.toList(),
        orderBy: 'difficulty ASC, template ASC',
      );
    } else {
      rows = await db.query(
        'sentence_patterns',
        orderBy: 'is_template DESC, difficulty ASC, template ASC',
      );
    }
    return _hydratePatterns(rows);
  }

  @override
  Future<SentencePattern?> getPattern(String id) async {
    final patterns = await listPatterns(ids: <String>{id});
    return patterns.isEmpty ? null : patterns.first;
  }

  Future<List<SentencePattern>> _hydratePatterns(
    List<Map<String, Object?>> rows,
  ) async {
    if (rows.isEmpty) return const <SentencePattern>[];
    final patternIds = rows.map((row) => row['id'] as String).toList();
    final marks = _placeholders(patternIds.length);

    final slotRows = await db.query(
      'pattern_slots',
      where: 'pattern_id IN ($marks)',
      whereArgs: patternIds,
      orderBy: 'position ASC',
    );
    final slotIds = slotRows.map((row) => row['id'] as String).toList();
    final variantRows = slotIds.isEmpty
        ? const <Map<String, Object?>>[]
        : await db.query(
            'slot_variants',
            where: 'slot_id IN (${_placeholders(slotIds.length)})',
            whereArgs: slotIds,
            orderBy: 'position ASC, rowid ASC',
          );
    final situationRows = await db.query(
      'pattern_situations',
      where: 'pattern_id IN ($marks)',
      whereArgs: patternIds,
    );
    final intentRows = await db.rawQuery(
      '''
      SELECT pi.pattern_id, i.name FROM pattern_intents pi
      INNER JOIN intents i ON i.id = pi.intent_id
      WHERE pi.pattern_id IN ($marks)
      ''',
      patternIds,
    );

    final variantsBySlot = <String, List<SlotVariant>>{};
    for (final row in variantRows) {
      final slotId = row['slot_id'] as String;
      variantsBySlot.putIfAbsent(slotId, () => <SlotVariant>[]).add(
            SlotVariant(
              id: row['id'] as String,
              slotId: slotId,
              text: Rows.text(row['text']),
              meaning: row['meaning'] as String?,
              level: row['level'] as String?,
              isValidated: Rows.boolean(row['is_validated']),
              position: Rows.toInt(row['position']),
            ),
          );
    }
    final slotsByPattern = <String, List<PatternSlot>>{};
    for (final row in slotRows) {
      final patternId = row['pattern_id'] as String;
      final slotId = row['id'] as String;
      slotsByPattern.putIfAbsent(patternId, () => <PatternSlot>[]).add(
            PatternSlot(
              id: slotId,
              patternId: patternId,
              name: Rows.text(row['name']),
              position: Rows.toInt(row['position']),
              expectedPos: row['expected_pos'] as String?,
              variants: variantsBySlot[slotId] ?? const <SlotVariant>[],
            ),
          );
    }
    final situationsByPattern = <String, List<String>>{};
    for (final row in situationRows) {
      situationsByPattern
          .putIfAbsent(row['pattern_id'] as String, () => <String>[])
          .add(row['situation_id'] as String);
    }
    final intentsByPattern = <String, List<String>>{};
    for (final row in intentRows) {
      intentsByPattern
          .putIfAbsent(row['pattern_id'] as String, () => <String>[])
          .add(row['name'] as String);
    }

    return <SentencePattern>[
      for (final row in rows)
        SentencePattern(
          id: row['id'] as String,
          template: Rows.text(row['template']),
          meaning: Rows.text(row['meaning']),
          difficulty: Rows.toInt(row['difficulty']),
          level: Rows.text(row['level'], 'B1'),
          register: Register.fromKey(row['register'] as String?),
          isTemplate: Rows.boolean(row['is_template']),
          sourceTemplateId: row['source_template_id'] as String?,
          slots: slotsByPattern[row['id'] as String] ?? const <PatternSlot>[],
          intentNames: intentsByPattern[row['id'] as String] ?? const <String>[],
          situationIds:
              situationsByPattern[row['id'] as String] ?? const <String>[],
        ),
    ];
  }

  @override
  Future<void> savePattern(SentencePattern pattern) async {
    await db.transaction((txn) async {
      await txn.insert(
        'sentence_patterns',
        <String, Object?>{
          'id': pattern.id,
          'template': pattern.template,
          'meaning': pattern.meaning,
          'difficulty': pattern.difficulty,
          'level': pattern.level,
          'register': pattern.register.key,
          'is_template': pattern.isTemplate ? 1 : 0,
          'source_template_id': pattern.sourceTemplateId,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      for (final slot in pattern.slots) {
        await txn.insert(
          'pattern_slots',
          <String, Object?>{
            'id': slot.id,
            'pattern_id': pattern.id,
            'name': slot.name,
            'position': slot.position,
            'expected_pos': slot.expectedPos,
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
        for (final variant in slot.variants) {
          await txn.insert(
            'slot_variants',
            _variantToRow(variant),
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      }
      for (final situationId in pattern.situationIds) {
        await txn.insert(
          'pattern_situations',
          <String, Object?>{
            'pattern_id': pattern.id,
            'situation_id': situationId,
          },
          conflictAlgorithm: ConflictAlgorithm.ignore,
        );
      }
    });
  }

  @override
  Future<SlotVariant> addSlotVariant(
    String slotId,
    String text, {
    String? meaning,
    bool isValidated = false,
  }) async {
    final countRows = await db.rawQuery(
      'SELECT COUNT(*) AS n FROM slot_variants WHERE slot_id = ?',
      <Object>[slotId],
    );
    final variant = SlotVariant(
      id: ids.next(),
      slotId: slotId,
      text: text.trim(),
      meaning: meaning,
      isValidated: isValidated,
      position: Rows.toInt(countRows.first['n']),
    );
    await db.insert('slot_variants', _variantToRow(variant));
    return variant;
  }

  Map<String, Object?> _variantToRow(SlotVariant variant) => <String, Object?>{
        'id': variant.id,
        'slot_id': variant.slotId,
        'text': variant.text,
        'meaning': variant.meaning,
        'level': variant.level,
        'is_validated': variant.isValidated ? 1 : 0,
        'position': variant.position,
      };

  // -------------------------------------------------------------------- chunks

  @override
  Future<List<Chunk>> listChunks({
    String? situationId,
    String? patternId,
    String? query,
    Set<String>? ids,
  }) async {
    if (ids != null && ids.isEmpty) return const <Chunk>[];
    final where = <String>[];
    final args = <Object>[];
    if (situationId != null) {
      where.add('situation_id = ?');
      args.add(situationId);
    }
    if (patternId != null) {
      where.add('pattern_id = ?');
      args.add(patternId);
    }
    if (query != null && query.trim().isNotEmpty) {
      final like = '%${query.trim().toLowerCase()}%';
      where.add('(LOWER(text) LIKE ? OR LOWER(meaning) LIKE ?)');
      args.addAll(<Object>[like, like]);
    }
    if (ids != null) {
      where.add('id IN (${_placeholders(ids.length)})');
      args.addAll(ids);
    }
    final rows = await db.query(
      'chunks',
      where: where.isEmpty ? null : where.join(' AND '),
      whereArgs: where.isEmpty ? null : args,
      orderBy: 'is_template ASC, created_at DESC, text ASC',
    );
    return rows.map(_chunkFromRow).toList();
  }

  @override
  Future<Chunk?> getChunk(String id) async {
    final rows = await db.query(
      'chunks',
      where: 'id = ?',
      whereArgs: <Object>[id],
      limit: 1,
    );
    return rows.isEmpty ? null : _chunkFromRow(rows.first);
  }

  @override
  Future<Chunk?> findChunkByText(String text) async {
    final rows = await db.query(
      'chunks',
      where: 'LOWER(text) = ?',
      whereArgs: <Object>[text.trim().toLowerCase()],
      limit: 1,
    );
    return rows.isEmpty ? null : _chunkFromRow(rows.first);
  }

  @override
  Future<void> saveChunk(Chunk chunk) async {
    await db.insert(
      'chunks',
      _chunkToRow(chunk),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  @override
  Future<void> deleteChunk(String id) async {
    await db.transaction((txn) async {
      await txn.delete(
        'review_history',
        where: 'chunk_id = ?',
        whereArgs: <Object>[id],
      );
      await txn.delete(
        'practice_attempts',
        where: 'chunk_id = ?',
        whereArgs: <Object>[id],
      );
      await txn.delete(
        'user_chunks',
        where: 'chunk_id = ?',
        whereArgs: <Object>[id],
      );
      await txn.delete(
        'line_chunks',
        where: 'chunk_id = ?',
        whereArgs: <Object>[id],
      );
      await txn.delete('chunks', where: 'id = ?', whereArgs: <Object>[id]);
    });
  }

  Chunk _chunkFromRow(Map<String, Object?> row) {
    final fillsRaw = jsonDecode(Rows.text(row['slot_fills_json'], '{}'));
    return Chunk(
      id: row['id'] as String,
      text: Rows.text(row['text']),
      type: ChunkType.fromKey(row['type'] as String?),
      meaning: Rows.text(row['meaning']),
      pronunciation: row['pronunciation'] as String?,
      patternId: row['pattern_id'] as String?,
      level: Rows.text(row['level'], 'B1'),
      register: Register.fromKey(row['register'] as String?),
      situationId: row['situation_id'] as String?,
      isTemplate: Rows.boolean(row['is_template']),
      sourceTemplateId: row['source_template_id'] as String?,
      slotFills: fillsRaw is Map
          ? <String, String>{
              for (final entry in fillsRaw.entries)
                entry.key as String: entry.value as String,
            }
          : const <String, String>{},
      createdAt: Rows.toDate(row['created_at']) ?? DateTime.utc(2026),
    );
  }

  Map<String, Object?> _chunkToRow(Chunk chunk) => <String, Object?>{
        'id': chunk.id,
        'text': chunk.text,
        'type': chunk.type.key,
        'meaning': chunk.meaning,
        'pronunciation': chunk.pronunciation,
        'pattern_id': chunk.patternId,
        'level': chunk.level,
        'register': chunk.register.key,
        'situation_id': chunk.situationId,
        'is_template': chunk.isTemplate ? 1 : 0,
        'source_template_id': chunk.sourceTemplateId,
        'slot_fills_json': jsonEncode(chunk.slotFills),
        'created_at': Rows.timestamp(chunk.createdAt),
      };

  // ----------------------------------------------------------------- dialogues

  @override
  Future<List<Dialogue>> listDialogues({
    String? situationId,
    bool? templates,
  }) async {
    final where = <String>[];
    final args = <Object>[];
    if (situationId != null) {
      where.add('situation_id = ?');
      args.add(situationId);
    }
    if (templates != null) {
      where.add('is_template = ?');
      args.add(templates ? 1 : 0);
    }
    final rows = await db.query(
      'dialogues',
      where: where.isEmpty ? null : where.join(' AND '),
      whereArgs: where.isEmpty ? null : args,
      orderBy: 'created_at DESC, title ASC',
    );
    return rows.map((row) => _dialogueFromRow(row, const <DialogueLine>[])).toList();
  }

  @override
  Future<Dialogue?> getDialogue(String id) async {
    final rows = await db.query(
      'dialogues',
      where: 'id = ?',
      whereArgs: <Object>[id],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final lineRows = await db.query(
      'dialogue_lines',
      where: 'dialogue_id = ?',
      whereArgs: <Object>[id],
      orderBy: 'position ASC',
    );
    final linkRows = await db.rawQuery(
      '''
      SELECT lc.line_id, lc.chunk_id FROM line_chunks lc
      INNER JOIN dialogue_lines dl ON dl.id = lc.line_id
      WHERE dl.dialogue_id = ?
      ORDER BY lc.position ASC
      ''',
      <Object>[id],
    );
    final chunkIdsByLine = <String, List<String>>{};
    for (final row in linkRows) {
      chunkIdsByLine
          .putIfAbsent(row['line_id'] as String, () => <String>[])
          .add(row['chunk_id'] as String);
    }
    final lines = <DialogueLine>[
      for (final row in lineRows)
        DialogueLine(
          id: row['id'] as String,
          dialogueId: id,
          position: Rows.toInt(row['position']),
          speaker: Speaker.fromKey(row['speaker'] as String?),
          text: Rows.text(row['text']),
          chunkIds: chunkIdsByLine[row['id'] as String] ?? const <String>[],
        ),
    ];
    return _dialogueFromRow(rows.first, lines);
  }

  Dialogue _dialogueFromRow(Map<String, Object?> row, List<DialogueLine> lines) =>
      Dialogue(
        id: row['id'] as String,
        situationId: row['situation_id'] as String,
        title: Rows.text(row['title']),
        level: Rows.text(row['level'], 'B1'),
        createdBy: Rows.text(row['created_by'], 'seed'),
        isTemplate: Rows.boolean(row['is_template']),
        sourceTemplateId: row['source_template_id'] as String?,
        createdAt: Rows.toDate(row['created_at']) ?? DateTime.utc(2026),
        lines: lines,
      );

  @override
  Future<void> saveComposedDialogue(ComposedDialogue composed) async {
    await db.transaction((txn) async {
      await txn.insert(
        'situations',
        _situationToRow(composed.situation),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      for (final chunk in composed.newChunks) {
        await txn.insert(
          'chunks',
          _chunkToRow(chunk),
          conflictAlgorithm: ConflictAlgorithm.ignore,
        );
      }
      final dialogue = composed.dialogue;
      await txn.insert('dialogues', <String, Object?>{
        'id': dialogue.id,
        'situation_id': dialogue.situationId,
        'title': dialogue.title,
        'level': dialogue.level,
        'created_by': dialogue.createdBy,
        'is_template': dialogue.isTemplate ? 1 : 0,
        'source_template_id': dialogue.sourceTemplateId,
        'created_at': Rows.timestamp(dialogue.createdAt),
      });
      for (final line in dialogue.lines) {
        await txn.insert('dialogue_lines', <String, Object?>{
          'id': line.id,
          'dialogue_id': dialogue.id,
          'position': line.position,
          'speaker': line.speaker.key,
          'text': line.text,
        });
        for (var i = 0; i < line.chunkIds.length; i++) {
          await txn.insert(
            'line_chunks',
            <String, Object?>{
              'line_id': line.id,
              'chunk_id': line.chunkIds[i],
              'position': i,
            },
            conflictAlgorithm: ConflictAlgorithm.ignore,
          );
        }
      }
    });
  }

  @override
  Future<void> deleteDialogue(String id) async {
    await db.transaction((txn) async {
      final dialogueRows = await txn.query(
        'dialogues',
        columns: <String>['situation_id', 'is_template'],
        where: 'id = ?',
        whereArgs: <Object>[id],
      );
      if (dialogueRows.isEmpty) return;
      await txn.rawDelete(
        'DELETE FROM line_chunks WHERE line_id IN '
        '(SELECT id FROM dialogue_lines WHERE dialogue_id = ?)',
        <Object>[id],
      );
      await txn.delete(
        'dialogue_lines',
        where: 'dialogue_id = ?',
        whereArgs: <Object>[id],
      );
      await txn.delete('dialogues', where: 'id = ?', whereArgs: <Object>[id]);

      // Learner situations exist only for their dialogue; remove the
      // instance when nothing else points at it.
      final row = dialogueRows.first;
      if (!Rows.boolean(row['is_template'])) {
        final situationId = row['situation_id'] as String;
        final remaining = await txn.rawQuery(
          'SELECT COUNT(*) AS n FROM dialogues WHERE situation_id = ?',
          <Object>[situationId],
        );
        final chunkRefs = await txn.rawQuery(
          'SELECT COUNT(*) AS n FROM chunks WHERE situation_id = ?',
          <Object>[situationId],
        );
        if (Rows.toInt(remaining.first['n']) == 0 &&
            Rows.toInt(chunkRefs.first['n']) == 0) {
          await txn.delete(
            'situations',
            where: 'id = ? AND is_template = 0',
            whereArgs: <Object>[situationId],
          );
        }
      }
    });
  }

  static String _placeholders(int count) =>
      List<String>.filled(count, '?').join(', ');
}
