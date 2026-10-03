import 'package:sqflite_common/sqlite_api.dart';

import '../../domain/repositories/learner_session.dart';

/// Stores the Neon Auth session token in the local `meta` table.
class SqliteLearnerSession implements LearnerSession {
  SqliteLearnerSession(this.db);

  static const String tokenKey = 'auth.sessionToken';

  final Database db;

  @override
  Future<String?> readToken() async {
    final rows = await db.query(
      'meta',
      columns: const <String>['value'],
      where: 'key = ?',
      whereArgs: const <Object>[tokenKey],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final value = rows.first['value'] as String?;
    if (value == null || value.isEmpty) return null;
    return value;
  }

  @override
  Future<void> writeToken(String token) async {
    await db.insert(
      'meta',
      <String, Object?>{'key': tokenKey, 'value': token},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  @override
  Future<void> clear() async {
    await db.delete(
      'meta',
      where: 'key = ?',
      whereArgs: const <Object>[tokenKey],
    );
  }
}
