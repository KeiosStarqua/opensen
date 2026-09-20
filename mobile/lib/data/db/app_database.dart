import 'package:sqflite_common/sqlite_api.dart';

/// Opens the local SQLite database and owns its schema.
///
/// The schema is the on-device adaptation of `docs/database-architecture.md`
/// for a single learner: no `users` table, `is_template` instead of
/// `owner_id`, and FSRS state keyed by chunk. Timestamps are ISO-8601 UTC
/// strings so they compare lexicographically.
class AppDatabase {
  const AppDatabase._();

  static const int schemaVersion = 1;
  static const String fileName = 'opensen.db';

  static Future<Database> open({
    required DatabaseFactory factory,
    required String path,
  }) {
    return factory.openDatabase(
      path,
      options: OpenDatabaseOptions(
        version: schemaVersion,
        onConfigure: (db) => db.execute('PRAGMA foreign_keys = ON'),
        onCreate: (db, version) async {
          for (final statement in createStatements) {
            await db.execute(statement);
          }
        },
        onUpgrade: (db, oldVersion, newVersion) async {
          // Add ALTER/CREATE statements per version bump here.
        },
      ),
    );
  }

  static const List<String> createStatements = <String>[
    '''
    CREATE TABLE meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )''',
    '''
    CREATE TABLE intents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )''',
    '''
    CREATE TABLE situations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'daily',
      role_self TEXT NOT NULL DEFAULT '',
      role_other TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      tone TEXT NOT NULL DEFAULT 'neutral',
      level TEXT NOT NULL DEFAULT 'B1',
      is_template INTEGER NOT NULL DEFAULT 1,
      source_template_id TEXT,
      prompts_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    )''',
    '''
    CREATE TABLE sentence_patterns (
      id TEXT PRIMARY KEY,
      template TEXT NOT NULL,
      meaning TEXT NOT NULL DEFAULT '',
      difficulty INTEGER NOT NULL DEFAULT 2,
      level TEXT NOT NULL DEFAULT 'B1',
      register TEXT NOT NULL DEFAULT 'neutral',
      is_template INTEGER NOT NULL DEFAULT 1,
      source_template_id TEXT
    )''',
    '''
    CREATE TABLE pattern_intents (
      pattern_id TEXT NOT NULL REFERENCES sentence_patterns(id),
      intent_id TEXT NOT NULL REFERENCES intents(id),
      PRIMARY KEY (pattern_id, intent_id)
    )''',
    '''
    CREATE TABLE pattern_situations (
      pattern_id TEXT NOT NULL REFERENCES sentence_patterns(id),
      situation_id TEXT NOT NULL REFERENCES situations(id),
      PRIMARY KEY (pattern_id, situation_id)
    )''',
    '''
    CREATE TABLE pattern_slots (
      id TEXT PRIMARY KEY,
      pattern_id TEXT NOT NULL REFERENCES sentence_patterns(id),
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      expected_pos TEXT,
      UNIQUE (pattern_id, name)
    )''',
    '''
    CREATE TABLE slot_variants (
      id TEXT PRIMARY KEY,
      slot_id TEXT NOT NULL REFERENCES pattern_slots(id),
      text TEXT NOT NULL,
      meaning TEXT,
      level TEXT,
      is_validated INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL DEFAULT 0
    )''',
    'CREATE INDEX idx_slot_variants_slot ON slot_variants(slot_id)',
    '''
    CREATE TABLE chunks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'sentence',
      meaning TEXT NOT NULL DEFAULT '',
      pronunciation TEXT,
      pattern_id TEXT REFERENCES sentence_patterns(id),
      level TEXT NOT NULL DEFAULT 'B1',
      register TEXT NOT NULL DEFAULT 'neutral',
      situation_id TEXT REFERENCES situations(id),
      is_template INTEGER NOT NULL DEFAULT 1,
      source_template_id TEXT,
      slot_fills_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )''',
    'CREATE INDEX idx_chunks_text ON chunks(text)',
    'CREATE INDEX idx_chunks_pattern ON chunks(pattern_id)',
    '''
    CREATE TABLE dialogues (
      id TEXT PRIMARY KEY,
      situation_id TEXT NOT NULL REFERENCES situations(id),
      title TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'B1',
      created_by TEXT NOT NULL DEFAULT 'seed',
      is_template INTEGER NOT NULL DEFAULT 1,
      source_template_id TEXT,
      created_at TEXT NOT NULL
    )''',
    '''
    CREATE TABLE dialogue_lines (
      id TEXT PRIMARY KEY,
      dialogue_id TEXT NOT NULL REFERENCES dialogues(id),
      position INTEGER NOT NULL,
      speaker TEXT NOT NULL,
      text TEXT NOT NULL
    )''',
    'CREATE INDEX idx_dialogue_lines_dialogue ON dialogue_lines(dialogue_id)',
    '''
    CREATE TABLE line_chunks (
      line_id TEXT NOT NULL REFERENCES dialogue_lines(id),
      chunk_id TEXT NOT NULL REFERENCES chunks(id),
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (line_id, chunk_id)
    )''',
    '''
    CREATE TABLE user_chunks (
      chunk_id TEXT PRIMARY KEY REFERENCES chunks(id),
      status TEXT NOT NULL DEFAULT 'new',
      step INTEGER NOT NULL DEFAULT 0,
      stability REAL,
      difficulty REAL,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      last_review TEXT,
      next_review TEXT,
      updated_at TEXT NOT NULL
    )''',
    'CREATE INDEX idx_user_chunks_next_review ON user_chunks(next_review)',
    '''
    CREATE TABLE practice_attempts (
      id TEXT PRIMARY KEY,
      chunk_id TEXT NOT NULL REFERENCES chunks(id),
      mode TEXT NOT NULL,
      prompt TEXT NOT NULL,
      expected TEXT NOT NULL,
      transcript TEXT,
      match_score REAL,
      used_hint INTEGER NOT NULL DEFAULT 0,
      attempted_at TEXT NOT NULL
    )''',
    '''
    CREATE TABLE review_history (
      id TEXT PRIMARY KEY,
      chunk_id TEXT NOT NULL REFERENCES chunks(id),
      rating INTEGER NOT NULL,
      elapsed_days INTEGER NOT NULL DEFAULT 0,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      state_before TEXT NOT NULL,
      practice_attempt_id TEXT REFERENCES practice_attempts(id),
      review_time TEXT NOT NULL
    )''',
    'CREATE INDEX idx_review_history_time ON review_history(review_time)',
  ];
}

/// Row mapping helpers shared by the SQLite repositories.
class Rows {
  const Rows._();

  static bool boolean(Object? value) => value is int ? value != 0 : value == true;

  static int toInt(Object? value) => value is int ? value : (value as num?)?.toInt() ?? 0;

  static double? toDouble(Object? value) => value == null ? null : (value as num).toDouble();

  static DateTime? toDate(Object? value) =>
      value == null ? null : DateTime.parse(value as String).toUtc();

  static String timestamp(DateTime value) => value.toUtc().toIso8601String();

  static String text(Object? value, [String fallback = '']) =>
      value is String ? value : fallback;
}
