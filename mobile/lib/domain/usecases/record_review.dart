import '../entities/practice.dart';
import '../repositories/practice_repository.dart';
import '../services/clock.dart';
import '../services/fsrs/fsrs_scheduler.dart';
import '../services/id_generator.dart';

/// Grades one chunk: runs FSRS, persists the new state, the review log row
/// and (optionally) what the learner produced.
class RecordReviewUseCase {
  const RecordReviewUseCase({
    required this.practice,
    required this.scheduler,
    required this.clock,
    required this.ids,
  });

  final PracticeRepository practice;
  final FsrsScheduler scheduler;
  final Clock clock;
  final IdGenerator ids;

  Future<UserChunkState> call({
    required UserChunkState state,
    required ReviewRating rating,
    PracticeItem? item,
    String? transcript,
    double? matchScore,
    bool usedHint = false,
  }) async {
    final now = clock.now();
    final outcome = scheduler.review(state, rating, now);
    PracticeAttempt? attempt;
    if (item != null) {
      attempt = PracticeAttempt(
        id: ids.next(),
        chunkId: state.chunkId,
        mode: item.mode,
        prompt: item.prompt,
        expected: item.expected,
        transcript: transcript,
        matchScore: matchScore,
        usedHint: usedHint,
        attemptedAt: now,
      );
    }
    final record = ReviewRecord(
      id: ids.next(),
      chunkId: state.chunkId,
      rating: rating,
      elapsedDays: outcome.elapsedDays,
      scheduledDays: outcome.scheduledDays,
      stateBefore: outcome.stateBefore,
      practiceAttemptId: attempt?.id,
      reviewTime: now,
    );
    await practice.recordReview(
      state: outcome.state,
      record: record,
      attempt: attempt,
    );
    return outcome.state;
  }
}
