import '../entities/practice.dart';

/// Learner-mutable practice data: FSRS state per chunk, the append-only
/// review log and recall attempts.
abstract class PracticeRepository {
  Future<UserChunkState?> getState(String chunkId);

  Future<Map<String, UserChunkState>> getStates(Iterable<String> chunkIds);

  /// Chunks currently in the practice plan.
  Future<Set<String>> enrolledChunkIds();

  /// Adds chunks to the plan, due immediately. Already enrolled chunks are
  /// left untouched.
  Future<void> enroll(Iterable<String> chunkIds, DateTime now);

  Future<void> unenroll(String chunkId);

  /// Due states ordered by due time; never-reviewed chunks come last so
  /// reviews are cleared before new material is introduced.
  Future<List<UserChunkState>> listDue(DateTime now, {int limit = 50});

  /// States not yet due, soonest first — for practising ahead of schedule.
  Future<List<UserChunkState>> listUpcoming(DateTime now, {int limit = 20});

  /// Number of first reviews (state before = new) recorded since [since].
  Future<int> countNewIntroducedSince(DateTime since);

  /// Stores the new state, appends the review log row and, when present, the
  /// attempt — all in one transaction.
  Future<void> recordReview({
    required UserChunkState state,
    required ReviewRecord record,
    PracticeAttempt? attempt,
  });

  Future<List<ReviewRecord>> listHistory({int limit = 100});

  Future<PlanStats> planStats(DateTime now);

  /// Clears all scheduling state, history and attempts.
  Future<void> resetProgress();
}
