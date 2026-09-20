import 'package:flutter_test/flutter_test.dart';
import 'package:opensen/domain/entities/practice.dart';
import 'package:opensen/domain/services/fsrs/fsrs_algorithm.dart';
import 'package:opensen/domain/services/fsrs/fsrs_parameters.dart';
import 'package:opensen/domain/services/fsrs/fsrs_scheduler.dart';

void main() {
  final now = DateTime.utc(2026, 9, 20, 9);

  group('FsrsParameters', () {
    test('defaults to the 19 FSRS-5 weights', () {
      final parameters = FsrsParameters();
      expect(parameters.weights, hasLength(FsrsParameters.weightCount));
      expect(parameters.desiredRetention, 0.9);
    });

    test('rejects wrong weight counts and impossible retention', () {
      expect(() => FsrsParameters(weights: <double>[1, 2]), throwsArgumentError);
      expect(() => FsrsParameters(desiredRetention: 1), throwsArgumentError);
    });
  });

  group('FsrsAlgorithm', () {
    final algorithm = FsrsAlgorithm(FsrsParameters());

    test('retrievability is 1 at t = 0 and 0.9 at t = stability', () {
      expect(algorithm.retrievability(0, 10), 1);
      expect(algorithm.retrievability(10, 10), closeTo(0.9, 1e-9));
      expect(algorithm.retrievability(30, 10), lessThan(0.9));
    });

    test('interval equals stability at 90% retention', () {
      expect(algorithm.nextIntervalDays(10), 10);
      expect(algorithm.nextIntervalDays(0.3), 1);
      expect(algorithm.nextIntervalDays(1e9), FsrsParameters().maximumIntervalDays);
    });

    test('higher retention shortens intervals', () {
      final strict = FsrsAlgorithm(FsrsParameters(desiredRetention: 0.95));
      expect(strict.nextIntervalDays(10), lessThan(algorithm.nextIntervalDays(10)));
    });

    test('initial stability and difficulty are monotonic in the grade', () {
      expect(algorithm.initialStability(1), lessThan(algorithm.initialStability(2)));
      expect(algorithm.initialStability(2), lessThan(algorithm.initialStability(3)));
      expect(algorithm.initialStability(3), lessThan(algorithm.initialStability(4)));
      expect(algorithm.initialDifficulty(1), greaterThan(algorithm.initialDifficulty(4)));
      expect(algorithm.initialDifficulty(1), inInclusiveRange(1, 10));
      expect(algorithm.initialDifficulty(4), inInclusiveRange(1, 10));
    });

    test('recall grows stability more for easy than hard; forget shrinks it', () {
      const difficulty = 5.0;
      const stability = 10.0;
      final retrievability = algorithm.retrievability(10, stability);
      final hard = algorithm.nextRecallStability(difficulty, stability, retrievability, 2);
      final good = algorithm.nextRecallStability(difficulty, stability, retrievability, 3);
      final easy = algorithm.nextRecallStability(difficulty, stability, retrievability, 4);
      final forgot = algorithm.nextForgetStability(difficulty, stability, retrievability);
      expect(hard, greaterThan(stability));
      expect(good, greaterThan(hard));
      expect(easy, greaterThan(good));
      expect(forgot, lessThan(stability));
      expect(forgot, greaterThanOrEqualTo(FsrsAlgorithm.minStability));
    });

    test('difficulty stays within bounds and moves with the grade', () {
      expect(algorithm.nextDifficulty(5, 1), greaterThan(5));
      expect(algorithm.nextDifficulty(5, 4), lessThan(5));
      expect(algorithm.nextDifficulty(10, 1), lessThanOrEqualTo(10));
      expect(algorithm.nextDifficulty(1, 4), greaterThanOrEqualTo(1));
    });
  });

  group('FsrsScheduler', () {
    final scheduler = FsrsScheduler(FsrsParameters());
    final fresh = UserChunkState.initial('chunk', now);

    test('a new chunk graded Good enters learning at the second step', () {
      final outcome = scheduler.review(fresh, ReviewRating.good, now);
      expect(outcome.stateBefore, ChunkStatus.fresh);
      expect(outcome.state.status, ChunkStatus.learning);
      expect(outcome.state.step, 1);
      expect(outcome.state.nextReview, now.add(const Duration(minutes: 10)));
      expect(outcome.state.reps, 1);
      expect(outcome.state.stability, isNotNull);
      expect(outcome.elapsedDays, 0);
    });

    test('a new chunk graded Forgot repeats the first step', () {
      final outcome = scheduler.review(fresh, ReviewRating.forgot, now);
      expect(outcome.state.status, ChunkStatus.learning);
      expect(outcome.state.step, 0);
      expect(outcome.state.nextReview, now.add(const Duration(minutes: 1)));
      expect(outcome.state.lapses, 0, reason: 'lapses only count from review');
    });

    test('Hard on the first step waits the average of the first two steps', () {
      final outcome = scheduler.review(fresh, ReviewRating.hard, now);
      expect(outcome.state.nextReview, now.add(const Duration(minutes: 5, seconds: 30)));
    });

    test('a new chunk graded Easy graduates straight to review', () {
      final outcome = scheduler.review(fresh, ReviewRating.easy, now);
      expect(outcome.state.status, ChunkStatus.review);
      expect(outcome.state.nextReview!.difference(now).inDays, greaterThanOrEqualTo(1));
    });

    test('Good at the last learning step graduates with a day-scale interval', () {
      final first = scheduler.review(fresh, ReviewRating.good, now).state;
      final later = now.add(const Duration(minutes: 10));
      final second = scheduler.review(first, ReviewRating.good, later);
      expect(second.state.status, ChunkStatus.review);
      expect(second.state.step, 0);
      expect(second.state.nextReview!.isAfter(later.add(const Duration(hours: 23))), isTrue);
    });

    test('forgetting a review chunk drops it into relearning and counts a lapse', () {
      final graduated = scheduler.review(fresh, ReviewRating.easy, now).state;
      final due = graduated.nextReview!;
      final outcome = scheduler.review(graduated, ReviewRating.forgot, due);
      expect(outcome.state.status, ChunkStatus.relearning);
      expect(outcome.state.lapses, 1);
      expect(outcome.state.nextReview, due.add(const Duration(minutes: 10)));
      expect(outcome.state.stability, lessThan(graduated.stability!));
      expect(outcome.scheduledDays, graduated.nextReview!.difference(now).inDays);
      expect(outcome.elapsedDays, due.difference(now).inDays);
    });

    test('review intervals grow with successive Good grades', () {
      var state = scheduler.review(fresh, ReviewRating.easy, now).state;
      var previousInterval = state.nextReview!.difference(now);
      for (var i = 0; i < 4; i++) {
        final at = state.nextReview!;
        state = scheduler.review(state, ReviewRating.good, at).state;
        final interval = state.nextReview!.difference(at);
        expect(interval, greaterThan(previousInterval));
        previousInterval = interval;
      }
      expect(state.status, ChunkStatus.review);
    });

    test('preview orders due times Forgot < Hard < Good < Easy for review chunks', () {
      final graduated = scheduler.review(fresh, ReviewRating.easy, now).state;
      final at = graduated.nextReview!;
      final preview = scheduler.preview(graduated, at);
      expect(preview[ReviewRating.forgot]!.isBefore(preview[ReviewRating.hard]!), isTrue);
      expect(preview[ReviewRating.hard]!.isBefore(preview[ReviewRating.good]!), isTrue);
      expect(preview[ReviewRating.good]!.isBefore(preview[ReviewRating.easy]!), isTrue);
    });

    test('with no learning steps a new chunk goes straight to review', () {
      final direct = FsrsScheduler(
        FsrsParameters(learningSteps: const <Duration>[], relearningSteps: const <Duration>[]),
      );
      final outcome = direct.review(fresh, ReviewRating.good, now);
      expect(outcome.state.status, ChunkStatus.review);
      final forgot = direct.review(outcome.state, ReviewRating.forgot, outcome.state.nextReview!);
      expect(forgot.state.status, ChunkStatus.review);
      expect(forgot.state.lapses, 1);
    });
  });
}
