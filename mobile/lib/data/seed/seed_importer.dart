import 'dart:convert';

import 'package:sqflite_common/sqlite_api.dart';

import '../db/app_database.dart';
import 'seed_content.dart';

/// Loads the seed bundle into the database once per seed version.
///
/// Template rows are inserted with `INSERT OR IGNORE`, so a newer bundle adds
/// content but never overwrites rows the learner may already be practising.
class SeedImporter {
  const SeedImporter(this.db);

  static const String versionKey = 'seed_version';

  final Database db;

  Future<int> currentVersion() async {
    final rows = await db.query(
      'meta',
      columns: <String>['value'],
      where: 'key = ?',
      whereArgs: <Object>[versionKey],
    );
    if (rows.isEmpty) return 0;
    return int.tryParse(rows.first['value'] as String) ?? 0;
  }

  /// Returns true when the bundle was imported.
  Future<bool> importIfNeeded(SeedBundle bundle) async {
    if (await currentVersion() >= bundle.version) return false;
    await import(bundle);
    return true;
  }

  Future<void> import(SeedBundle bundle) async {
    await db.transaction((txn) async {
      final batch = txn.batch();
      const ignore = ConflictAlgorithm.ignore;

      for (final intent in bundle.intents) {
        batch.insert(
          'intents',
          <String, Object?>{
            'id': intent.id,
            'name': intent.name,
            'description': intent.description,
          },
          conflictAlgorithm: ignore,
        );
      }
      final intentIdByName = <String, String>{
        for (final intent in bundle.intents) intent.name: intent.id,
      };

      for (final situation in bundle.situations) {
        batch.insert(
          'situations',
          <String, Object?>{
            'id': situation.id,
            'name': situation.name,
            'description': situation.description,
            'category': situation.category.key,
            'role_self': situation.roleSelf,
            'role_other': situation.roleOther,
            'goal': situation.goal,
            'tone': situation.tone.key,
            'level': situation.level,
            'is_template': 1,
            'source_template_id': null,
            'prompts_json': jsonEncode(
              situation.prompts.map((p) => p.toJson()).toList(),
            ),
            'created_at': Rows.timestamp(situation.createdAt),
          },
          conflictAlgorithm: ignore,
        );
      }

      for (final pattern in bundle.patterns) {
        batch.insert(
          'sentence_patterns',
          <String, Object?>{
            'id': pattern.id,
            'template': pattern.template,
            'meaning': pattern.meaning,
            'difficulty': pattern.difficulty,
            'level': pattern.level,
            'register': pattern.register.key,
            'is_template': 1,
            'source_template_id': null,
          },
          conflictAlgorithm: ignore,
        );
        for (final slot in pattern.slots) {
          batch.insert(
            'pattern_slots',
            <String, Object?>{
              'id': slot.id,
              'pattern_id': pattern.id,
              'name': slot.name,
              'position': slot.position,
              'expected_pos': slot.expectedPos,
            },
            conflictAlgorithm: ignore,
          );
          for (final variant in slot.variants) {
            batch.insert(
              'slot_variants',
              <String, Object?>{
                'id': variant.id,
                'slot_id': slot.id,
                'text': variant.text,
                'meaning': variant.meaning,
                'level': variant.level,
                'is_validated': variant.isValidated ? 1 : 0,
                'position': variant.position,
              },
              conflictAlgorithm: ignore,
            );
          }
        }
        for (final intentName in pattern.intentNames) {
          final intentId = intentIdByName[intentName];
          if (intentId == null) continue;
          batch.insert(
            'pattern_intents',
            <String, Object?>{'pattern_id': pattern.id, 'intent_id': intentId},
            conflictAlgorithm: ignore,
          );
        }
        for (final situationId in pattern.situationIds) {
          batch.insert(
            'pattern_situations',
            <String, Object?>{
              'pattern_id': pattern.id,
              'situation_id': situationId,
            },
            conflictAlgorithm: ignore,
          );
        }
      }

      for (final chunk in bundle.chunks) {
        batch.insert(
          'chunks',
          <String, Object?>{
            'id': chunk.id,
            'text': chunk.text,
            'type': chunk.type.key,
            'meaning': chunk.meaning,
            'pronunciation': chunk.pronunciation,
            'pattern_id': chunk.patternId,
            'level': chunk.level,
            'register': chunk.register.key,
            'situation_id': chunk.situationId,
            'is_template': 1,
            'source_template_id': null,
            'slot_fills_json': jsonEncode(chunk.slotFills),
            'created_at': Rows.timestamp(chunk.createdAt),
          },
          conflictAlgorithm: ignore,
        );
      }

      for (final dialogue in bundle.dialogues) {
        batch.insert(
          'dialogues',
          <String, Object?>{
            'id': dialogue.id,
            'situation_id': dialogue.situationId,
            'title': dialogue.title,
            'level': dialogue.level,
            'created_by': dialogue.createdBy,
            'is_template': 1,
            'source_template_id': null,
            'created_at': Rows.timestamp(dialogue.createdAt),
          },
          conflictAlgorithm: ignore,
        );
        for (final line in dialogue.lines) {
          batch.insert(
            'dialogue_lines',
            <String, Object?>{
              'id': line.id,
              'dialogue_id': dialogue.id,
              'position': line.position,
              'speaker': line.speaker.key,
              'text': line.text,
            },
            conflictAlgorithm: ignore,
          );
          for (var i = 0; i < line.chunkIds.length; i++) {
            batch.insert(
              'line_chunks',
              <String, Object?>{
                'line_id': line.id,
                'chunk_id': line.chunkIds[i],
                'position': i,
              },
              conflictAlgorithm: ignore,
            );
          }
        }
      }

      batch.insert(
        'meta',
        <String, Object?>{'key': versionKey, 'value': '${bundle.version}'},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      await batch.commit(noResult: true);
    });
  }
}
