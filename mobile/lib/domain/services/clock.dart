/// Time source. All domain code takes `now` from a [Clock] so scheduling is
/// testable; timestamps are UTC.
abstract class Clock {
  DateTime now();
}

class SystemClock implements Clock {
  const SystemClock();

  @override
  DateTime now() => DateTime.now().toUtc();
}

/// Controllable clock for tests.
class FixedClock implements Clock {
  FixedClock(this._now);

  DateTime _now;

  @override
  DateTime now() => _now;

  void set(DateTime value) => _now = value;

  void advance(Duration duration) => _now = _now.add(duration);
}

/// Local-calendar helpers shared by stats and daily limits.
class DayBoundary {
  const DayBoundary._();

  /// Start of the local day containing [instant], expressed in UTC.
  static DateTime startOfLocalDay(DateTime instant) {
    final local = instant.toLocal();
    return DateTime(local.year, local.month, local.day).toUtc();
  }

  /// Start of the local day [daysAhead] days after the one containing
  /// [instant], expressed in UTC.
  static DateTime startOfLocalDayOffset(DateTime instant, int daysAhead) {
    final local = instant.toLocal();
    return DateTime(local.year, local.month, local.day + daysAhead).toUtc();
  }
}
