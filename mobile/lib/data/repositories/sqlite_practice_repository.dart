import 'package:sqflite_common/sqlite_api.dart';

import '../../domain/entities/practice.dart';
import '../../domain/repositories/practice_repository.dart';
import '../../domain/services/clock.dart';
import '../db/app_database.dart';

class SqlitePracticeRepository implements PracticeRepository {
  SqlitePracticeRepository(this.db);

  final Database db;

  @override
  Future<UserChunkState?> getState(String chunkId) async {
    final rows = await db.query(
      'user_chunks',
      where: 'chunk_id = ?',
      whereArgs: <Object>[chunkId],
      limit: 1,
    );
    return rows.isEmpty ? null : _stateFromRow(rows.first);
  }

  @override
  Future<Map<String, UserChunkState>> getStates(
    Iterable<String> chunkIds,
  ) async {
    final ids = chunkIds.toList();
    if (ids.isEmpty) return const <String, UserChunkState>{};
    final rows = await db.query(
      'user_chunks',
      where: 'chunk_id IN (${_placeholders(ids.length)})',
      whereArgs: ids,
    );
    return <String, UserChunkState>{
      for (final row in rows) row['chunk_id'] as String: _stateFromRow(row),
    };
  }

  @override
  Future<Set<String>> enrolledChunkIds() async {
    final rows = await db.query('user_chunks', columns: <String>['chunk_id']);
    return rows.map((row) => row['chunk_id'] as String).toSet();
  }

  @override
  Future<void> enroll(Iterable<String> chunkIds, DateTime now) async {
    final batch = db.batch();
    for (final chunkId in chunkIds) {
      batch.insert(
        'user_chunks',
        _stateToRow(UserChunkState.initial(chunkId, now)),
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    }
    await batch.commit(noResult: true);
  }

  @override
  Future<void> unenroll(String chunkId) async {
    await db.delete(
      'user_chunks',
      where: 'chunk_id = ?',
      whereArgs: <Object>[chunkId],
    );
  }

  @override
  Future<List<UserChunkState>> listDue(DateTime now, {int limit = 50}) async {
    final rows = await db.query(
      'user_chunks',
      where: 'next_review IS NULL OR next_review <= ?',
      whereArgs: <Object>[Rows.timestamp(now)],
      orderBy: "CASE WHEN status = 'new' THEN 1 ELSE 0 END ASC, "
          'next_review ASC, updated_at ASC',
      limit: limit,
    );
    return rows.map(_stateFromRow).toList();
  }

  @override
  Future<List<UserChunkState>> listUpcoming(
    DateTime now, {
    int limit = 20,
  }) async {
    final rows = await db.query(
      'user_chunks',
      where: 'next_review > ?',
      whereArgs: <Object>[Rows.timestamp(now)],
      orderBy: 'next_review ASC',
      limit: limit,
    );
    return rows.map(_stateFromRow).toList();
  }

  @override
  Future<int> countNewIntroducedSince(DateTime since) async {
    final rows = await db.rawQuery(
      'SELECT COUNT(*) AS n FROM review_history '
      "WHERE state_before = 'new' AND review_time >= ?",
      <Object>[Rows.timestamp(since)],
    );
    return Rows.toInt(rows.first['n']);
  }

  @override
  Future<void> recordReview({
    required UserChunkState state,
    required ReviewRecord record,
    PracticeAttempt? attempt,
  }) async {
    await db.transaction((txn) async {
      if (attempt != null) {
        await txn.insert('practice_attempts', <String, Object?>{
          'id': attempt.id,
          'chunk_id': attempt.chunkId,
          'mode': attempt.mode.key,
          'prompt': attempt.prompt,
          'expected': attempt.expected,
          'transcript': attempt.transcript,
          'match_score': attempt.matchScore,
          'used_hint': attempt.usedHint ? 1 : 0,
          'attempted_at': Rows.timestamp(attempt.attemptedAt),
        });
      }
      await txn.insert(
        'user_chunks',
        _stateToRow(state),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      await txn.insert('review_history', <String, Object?>{
        'id': record.id,
        'chunk_id': record.chunkId,
        'rating': record.rating.grade,
        'elapsed_days': record.elapsedDays,
        'scheduled_days': record.scheduledDays,
        'state_before': record.stateBefore.key,
        'practice_attempt_id': record.practiceAttemptId,
        'review_time': Rows.timestamp(record.reviewTime),
      });
    });
  }

  @override
  Future<List<ReviewRecord>> listHistory({int limit = 100}) async {
    final rows = await db.query(
      'review_history',
      orderBy: 'review_time DESC',
      limit: limit,
    );
    return <ReviewRecord>[
      for (final row in rows)
        ReviewRecord(
          id: row['id'] as String,
          chunkId: row['chunk_id'] as String,
          rating: ReviewRating.fromGrade(Rows.toInt(row['rating'])),
          elapsedDays: Rows.toInt(row['elapsed_days']),
          scheduledDays: Rows.toInt(row['scheduled_days']),
          stateBefore: ChunkStatus.fromKey(row['state_before'] as String?),
          practiceAttemptId: row['practice_attempt_id'] as String?,
          reviewTime: Rows.toDate(row['review_time'])!,
        ),
    ];
  }

  @override
  Future<PlanStats> planStats(DateTime now) async {
    final totalRows = await db.rawQuery(
      'SELECT status, COUNT(*) AS n FROM user_chunks GROUP BY status',
    );
    final byStatus = <ChunkStatus, int>{};
    var total = 0;
    for (final row in totalRows) {
      final count = Rows.toInt(row['n']);
      byStatus[ChunkStatus.fromKey(row['status'] as String?)] = count;
      total += count;
    }

    final dueNowRows = await db.rawQuery(
      'SELECT COUNT(*) AS n FROM user_chunks '
      'WHERE next_review IS NULL OR next_review <= ?',
      <Object>[Rows.timestamp(now)],
    );

    final dueNext7Days = <int>[];
    for (var day = 0; day < 7; day++) {
      final end = DayBoundary.startOfLocalDayOffset(now, day + 1);
      final String where;
      final List<Object> args;
      if (day == 0) {
        where = 'next_review IS NULL OR next_review < ?';
        args = <Object>[Rows.timestamp(end)];
      } else {
        final start = DayBoundary.startOfLocalDayOffset(now, day);
        where = 'next_review >= ? AND next_review < ?';
        args = <Object>[Rows.timestamp(start), Rows.timestamp(end)];
      }
      final rows = await db.rawQuery(
        'SELECT COUNT(*) AS n FROM user_chunks WHERE $where',
        args,
      );
      dueNext7Days.add(Rows.toInt(rows.first['n']));
    }

    final todayStart = DayBoundary.startOfLocalDay(now);
    final reviewedTodayRows = await db.rawQuery(
      'SELECT COUNT(*) AS n FROM review_history WHERE review_time >= ?',
      <Object>[Rows.timestamp(todayStart)],
    );

    final historyRows = await db.query(
      'review_history',
      columns: <String>['review_time'],
      orderBy: 'review_time DESC',
      limit: 5000,
    );
    final reviewDays = <DateTime>{};
    for (final row in historyRows) {
      final local = Rows.toDate(row['review_time'])!.toLocal();
      reviewDays.add(DateTime(local.year, local.month, local.day));
    }

    return PlanStats(
      total: total,
      byStatus: byStatus,
      dueNow: Rows.toInt(dueNowRows.first['n']),
      dueNext7Days: dueNext7Days,
      reviewedToday: Rows.toInt(reviewedTodayRows.first['n']),
      streakDays: streakLength(reviewDays, now.toLocal()),
    );
  }

  /// Consecutive local days with at least one review, ending today or
  /// yesterday (a streak survives until the end of the current day).
  static int streakLength(Set<DateTime> reviewDays, DateTime localNow) {
    var cursor = DateTime(localNow.year, localNow.month, localNow.day);
    if (!reviewDays.contains(cursor)) {
      cursor = cursor.subtract(const Duration(days: 1));
      if (!reviewDays.contains(cursor)) return 0;
    }
    var streak = 0;
    while (reviewDays.contains(cursor)) {
      streak++;
      cursor = DateTime(cursor.year, cursor.month, cursor.day - 1);
    }
    return streak;
  }

  @override
  Future<void> resetProgress() async {
    await db.transaction((txn) async {
      await txn.delete('review_history');
      await txn.delete('practice_attempts');
      await txn.delete('user_chunks');
    });
  }

  UserChunkState _stateFromRow(Map<String, Object?> row) => UserChunkState(
        chunkId: row['chunk_id'] as String,
        status: ChunkStatus.fromKey(row['status'] as String?),
        step: Rows.toInt(row['step']),
        stability: Rows.toDouble(row['stability']),
        difficulty: Rows.toDouble(row['difficulty']),
        reps: Rows.toInt(row['reps']),
        lapses: Rows.toInt(row['lapses']),
        lastReview: Rows.toDate(row['last_review']),
        nextReview: Rows.toDate(row['next_review']),
        updatedAt: Rows.toDate(row['updated_at']) ?? DateTime.utc(2026),
      );

  Map<String, Object?> _stateToRow(UserChunkState state) => <String, Object?>{
        'chunk_id': state.chunkId,
        'status': state.status.key,
        'step': state.step,
        'stability': state.stability,
        'difficulty': state.difficulty,
        'reps': state.reps,
        'lapses': state.lapses,
        'last_review':
            state.lastReview == null ? null : Rows.timestamp(state.lastReview!),
        'next_review':
            state.nextReview == null ? null : Rows.timestamp(state.nextReview!),
        'updated_at': Rows.timestamp(state.updatedAt),
      };

  static String _placeholders(int count) =>
      List<String>.filled(count, '?').join(', ');
}
