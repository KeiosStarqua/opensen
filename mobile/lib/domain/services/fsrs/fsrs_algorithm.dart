import 'dart:math' as math;

import 'fsrs_parameters.dart';

/// The FSRS-5 memory model: retrievability, stability and difficulty updates.
///
/// Pure functions of the parameters; the state machine that turns them into
/// due dates lives in `FsrsScheduler`. Grades are 1 (Again/Forgot) to 4
/// (Easy).
class FsrsAlgorithm {
  FsrsAlgorithm(this.parameters);

  final FsrsParameters parameters;

  /// Forgetting-curve exponent shared by every FSRS-4.5/5 implementation.
  static const double decay = -0.5;

  /// Chosen so that R(t = S) = 0.9 → 19/81.
  static final double factor = math.pow(0.9, 1 / decay).toDouble() - 1;

  static const double minStability = 0.01;

  List<double> get _w => parameters.weights;

  /// Probability of recall after [elapsedDays] with memory [stability].
  double retrievability(double elapsedDays, double stability) {
    if (stability <= 0) return 0;
    if (elapsedDays <= 0) return 1;
    return math.pow(1 + factor * elapsedDays / stability, decay).toDouble();
  }

  /// Days until retrievability decays to the desired retention.
  int nextIntervalDays(double stability) {
    final retentionTerm =
        math.pow(parameters.desiredRetention, 1 / decay).toDouble() - 1;
    final raw = stability / factor * retentionTerm;
    final days = raw.round();
    return math.max(1, math.min(days, parameters.maximumIntervalDays));
  }

  double initialStability(int grade) => _clampStability(_w[grade - 1]);

  double initialDifficulty(int grade) =>
      _clampDifficulty(_w[4] - math.exp(_w[5] * (grade - 1)) + 1);

  /// Linear damping toward 10 plus mean reversion toward D0(Easy).
  double nextDifficulty(double difficulty, int grade) {
    final delta = -_w[6] * (grade - 3);
    final damped = difficulty + delta * (10 - difficulty) / 9;
    final reverted = _w[7] * initialDifficulty(4) + (1 - _w[7]) * damped;
    return _clampDifficulty(reverted);
  }

  /// Stability after a successful recall (grade 2–4) at least a day later.
  double nextRecallStability(
    double difficulty,
    double stability,
    double retrievability,
    int grade,
  ) {
    final hardPenalty = grade == 2 ? _w[15] : 1.0;
    final easyBonus = grade == 4 ? _w[16] : 1.0;
    final growth = math.exp(_w[8]) *
        (11 - difficulty) *
        math.pow(stability, -_w[9]).toDouble() *
        (math.exp(_w[10] * (1 - retrievability)) - 1) *
        hardPenalty *
        easyBonus;
    return _clampStability(stability * (1 + growth));
  }

  /// Stability after forgetting (grade 1) at least a day later. Never exceeds
  /// the previous stability.
  double nextForgetStability(
    double difficulty,
    double stability,
    double retrievability,
  ) {
    final next = _w[11] *
        math.pow(difficulty, -_w[12]).toDouble() *
        (math.pow(stability + 1, _w[13]).toDouble() - 1) *
        math.exp(_w[14] * (1 - retrievability));
    return _clampStability(math.min(next, stability));
  }

  /// Stability after a same-day review (learning / relearning steps).
  double nextShortTermStability(double stability, int grade) =>
      _clampStability(stability * math.exp(_w[17] * (grade - 3 + _w[18])));

  static double _clampDifficulty(double value) =>
      value.clamp(1.0, 10.0).toDouble();

  static double _clampStability(double value) =>
      value.isNaN || value < minStability ? minStability : value;
}
