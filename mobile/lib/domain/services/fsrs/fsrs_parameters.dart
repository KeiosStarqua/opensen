/// Tunable inputs of the FSRS scheduler.
///
/// Defaults are the published FSRS-5 weights (19 parameters). Learning steps
/// follow the common `1m, 10m` / `10m` convention so a forgotten chunk comes
/// back within the same session before graduating to day-scale intervals.
class FsrsParameters {
  FsrsParameters({
    List<double>? weights,
    this.desiredRetention = 0.9,
    this.maximumIntervalDays = 36500,
    this.learningSteps = const <Duration>[
      Duration(minutes: 1),
      Duration(minutes: 10),
    ],
    this.relearningSteps = const <Duration>[Duration(minutes: 10)],
  }) : weights = List<double>.unmodifiable(weights ?? fsrs5DefaultWeights) {
    if (this.weights.length != weightCount) {
      throw ArgumentError.value(
        weights,
        'weights',
        'FSRS-5 requires exactly $weightCount weights',
      );
    }
    if (desiredRetention <= 0 || desiredRetention >= 1) {
      throw ArgumentError.value(
        desiredRetention,
        'desiredRetention',
        'must be strictly between 0 and 1',
      );
    }
  }

  static const int weightCount = 19;

  static const List<double> fsrs5DefaultWeights = <double>[
    0.40255,
    1.18385,
    3.173,
    15.69105,
    7.1949,
    0.5345,
    1.4604,
    0.0046,
    1.54575,
    0.1192,
    1.01925,
    1.9395,
    0.11,
    0.29605,
    2.2698,
    0.2315,
    2.9898,
    0.51655,
    0.6621,
  ];

  final List<double> weights;
  final double desiredRetention;
  final int maximumIntervalDays;
  final List<Duration> learningSteps;
  final List<Duration> relearningSteps;

  FsrsParameters copyWith({
    List<double>? weights,
    double? desiredRetention,
    int? maximumIntervalDays,
    List<Duration>? learningSteps,
    List<Duration>? relearningSteps,
  }) {
    return FsrsParameters(
      weights: weights ?? this.weights,
      desiredRetention: desiredRetention ?? this.desiredRetention,
      maximumIntervalDays: maximumIntervalDays ?? this.maximumIntervalDays,
      learningSteps: learningSteps ?? this.learningSteps,
      relearningSteps: relearningSteps ?? this.relearningSteps,
    );
  }
}
