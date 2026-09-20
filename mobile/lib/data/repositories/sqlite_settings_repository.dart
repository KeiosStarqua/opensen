import 'package:sqflite_common/sqlite_api.dart';

import '../../domain/entities/learner_settings.dart';
import '../../domain/repositories/settings_repository.dart';

/// Stores learner settings as `settings.<key>` rows in the `meta` table, so
/// the app needs no second persistence plugin.
class SqliteSettingsRepository implements SettingsRepository {
  SqliteSettingsRepository(this.db);

  static const String prefix = 'settings.';

  final Database db;

  @override
  Future<LearnerSettings> load() async {
    final rows = await db.query(
      'meta',
      where: 'key LIKE ?',
      whereArgs: <Object>['$prefix%'],
    );
    return LearnerSettings.fromMap(<String, String>{
      for (final row in rows)
        (row['key'] as String).substring(prefix.length): row['value'] as String,
    });
  }

  @override
  Future<void> save(LearnerSettings settings) async {
    final batch = db.batch();
    batch.delete('meta', where: 'key LIKE ?', whereArgs: <Object>['$prefix%']);
    for (final entry in settings.toMap().entries) {
      batch.insert(
        'meta',
        <String, Object?>{'key': '$prefix${entry.key}', 'value': entry.value},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
}
