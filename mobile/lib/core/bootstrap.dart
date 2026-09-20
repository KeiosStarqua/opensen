import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show rootBundle;
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart' as sqflite;
import 'package:sqflite_common/sqlite_api.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart' as ffi;

import '../data/db/app_database.dart';
import '../data/repositories/sqlite_settings_repository.dart';
import '../data/seed/seed_content.dart';
import '../data/seed/seed_importer.dart';
import '../domain/entities/learner_settings.dart';

/// Everything `main` must have before the first frame: an open, seeded
/// database and the persisted settings.
class AppBootstrap {
  const AppBootstrap({required this.database, required this.settings});

  final Database database;
  final LearnerSettings settings;

  static const String seedAssetPath = 'assets/seed/content.json';

  /// Opens (or creates) the database, imports the bundled seed content when
  /// it is newer than the stored version, and loads settings.
  static Future<AppBootstrap> run() async {
    final factory = resolveDatabaseFactory();
    final path = p.join(await factory.getDatabasesPath(), AppDatabase.fileName);
    final database = await AppDatabase.open(factory: factory, path: path);

    final seedJson = await rootBundle.loadString(seedAssetPath);
    await SeedImporter(database).importIfNeeded(SeedBundle.parse(seedJson));

    final settings = await SqliteSettingsRepository(database).load();
    return AppBootstrap(database: database, settings: settings);
  }

  /// `sqflite` on Android/iOS/macOS; the FFI factory on Windows/Linux, where
  /// the plugin has no implementation. Web is not supported.
  static DatabaseFactory resolveDatabaseFactory() {
    if (!kIsWeb && (Platform.isWindows || Platform.isLinux)) {
      ffi.sqfliteFfiInit();
      return ffi.databaseFactoryFfi;
    }
    return sqflite.databaseFactory;
  }
}
