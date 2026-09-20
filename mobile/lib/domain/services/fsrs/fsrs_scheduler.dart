import 'dart:math' as math;

import '../../entities/practice.dart';
import 'fsrs_algorithm.dart';
import 'fsrs_parameters.dart';

/// Result of grading one chunk: the next state plus the numbers the
/// append-only review log needs.
class SchedulingOutcome {
  const SchedulingOutcome({
    required this.state,
    required this.stateBefore,
    required this.elapsedDays,
    required this.scheduledDays,
  });

  final UserChunkState state;
  final ChunkStatus stateBefore;

  /// Whole days since the previous review (0 for a first review).
  final int elapsedDays;

  /// Whole days the previous schedule had planned (0 when unknown).
  final int scheduledDays;
}

class _Transition {
  const _Transition(this.status, this.step, this.due, {this.lapse = false});

  final ChunkStatus status;
  final int step;
  final DateTime due;
  final bool lapse;
}

/// FSRS state machine with learning / relearning steps.
///
/// `new`/`learning` cards walk through [FsrsParameters.learningSteps] and
/// graduate to `review`; a forgotten `review` card drops into `relearning`.
/// Day-scale intervals always come from stability and desired retention.
class FsrsScheduler {
  FsrsScheduler(this.parameters) : algorithm = FsrsAlgorithm(parameters);

  final FsrsParameters parameters;
  final FsrsAlgorithm algorithm;

  SchedulingOutcome review(
    UserChunkState card,
    ReviewRating rating,
    DateTime now,
  ) {
    final grade = rating.grade;
    final lastReview = card.lastReview;
    final daysSinceLast = lastReview == null
        ? null
        : now.difference(lastReview).inMilliseconds /
            Duration.millisecondsPerDay;

    final double stability;
    final double difficulty;
    final previousStability = card.stability;
    final previousDifficulty = card.difficulty;
    if (previousStability == null ||
        previousDifficulty == null ||
        daysSinceLast == null) {
      stability = algorithm.initialStability(grade);
      difficulty = algorithm.initialDifficulty(grade);
    } else if (daysSinceLast < 1) {
      stability = algorithm.nextShortTermStability(previousStability, grade);
      difficulty = algorithm.nextDifficulty(previousDifficulty, grade);
    } else {
      final retrievability = algorithm.retrievability(
        daysSinceLast,
        previousStability,
      );
      stability = grade == 1
          ? algorithm.nextForgetStability(
              previousDifficulty,
              previousStability,
              retrievability,
            )
          : algorithm.nextRecallStability(
              previousDifficulty,
              previousStability,
              retrievability,
              grade,
            );
      difficulty = algorithm.nextDifficulty(previousDifficulty, grade);
    }

    final transition = _transition(card, rating, stability, now);
    final scheduledDays = lastReview != null && card.nextReview != null
        ? _wholeDays(card.nextReview!.difference(lastReview))
        : 0;
    final elapsedDays = daysSinceLast == null ? 0 : daysSinceLast.floor();

    return SchedulingOutcome(
      state: card.copyWith(
        status: transition.status,
        step: transition.step,
        stability: stability,
        difficulty: difficulty,
        reps: card.reps + 1,
        lapses: card.lapses + (transition.lapse ? 1 : 0),
        lastReview: now,
        nextReview: transition.due,
        updatedAt: now,
      ),
      stateBefore: card.status,
      elapsedDays: elapsedDays,
      scheduledDays: scheduledDays,
    );
  }

  /// Due time for each grade, for showing intervals on the grading buttons.
  Map<ReviewRating, DateTime> preview(UserChunkState card, DateTime now) =>
      <ReviewRating, DateTime>{
        for (final rating in ReviewRating.values)
          rating: review(card, rating, now).state.nextReview!,
      };

  _Transition _transition(
    UserChunkState card,
    ReviewRating rating,
    double stability,
    DateTime now,
  ) {
    switch (card.status) {
      case ChunkStatus.fresh:
      case ChunkStatus.learning:
        return _walkSteps(
          steps: parameters.learningSteps,
          inStepsStatus: ChunkStatus.learning,
          step: card.step,
          rating: rating,
          stability: stability,
          now: now,
        );
      case ChunkStatus.relearning:
        return _walkSteps(
          steps: parameters.relearningSteps,
          inStepsStatus: ChunkStatus.relearning,
          step: card.step,
          rating: rating,
          stability: stability,
          now: now,
        );
      case ChunkStatus.review:
        if (rating != ReviewRating.forgot) {
          return _Transition(
            ChunkStatus.review,
            0,
            now.add(_intervalFor(stability)),
          );
        }
        if (parameters.relearningSteps.isEmpty) {
          return _Transition(
            ChunkStatus.review,
            0,
            now.add(_intervalFor(stability)),
            lapse: true,
          );
        }
        return _Transition(
          ChunkStatus.relearning,
          0,
          now.add(parameters.relearningSteps.first),
          lapse: true,
        );
    }
  }

  _Transition _walkSteps({
    required List<Duration> steps,
    required ChunkStatus inStepsStatus,
    required int step,
    required ReviewRating rating,
    required double stability,
    required DateTime now,
  }) {
    _Transition graduate() =>
        _Transition(ChunkStatus.review, 0, now.add(_intervalFor(stability)));

    if (steps.isEmpty ||
        (step >= steps.length && rating != ReviewRating.forgot)) {
      return graduate();
    }
    switch (rating) {
      case ReviewRating.forgot:
        return _Transition(inStepsStatus, 0, now.add(steps.first));
      case ReviewRating.hard:
        final Duration wait;
        if (step == 0 && steps.length == 1) {
          wait = steps.first * 1.5;
        } else if (step == 0) {
          wait = (steps[0] + steps[1]) ~/ 2;
        } else {
          wait = steps[math.min(step, steps.length - 1)];
        }
        return _Transition(inStepsStatus, step, now.add(wait));
      case ReviewRating.good:
        if (step + 1 >= steps.length) return graduate();
        return _Transition(inStepsStatus, step + 1, now.add(steps[step + 1]));
      case ReviewRating.easy:
        return graduate();
    }
  }

  Duration _intervalFor(double stability) =>
      Duration(days: algorithm.nextIntervalDays(stability));

  static int _wholeDays(Duration duration) =>
      (duration.inMinutes / Duration.minutesPerDay).round();
}
