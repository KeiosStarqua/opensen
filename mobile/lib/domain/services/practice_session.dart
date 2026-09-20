import 'dart:math';

import '../entities/chunk.dart';
import '../entities/practice.dart';
import '../entities/sentence_pattern.dart';
import 'practice_item_factory.dart';

/// One chunk in a session together with its scheduling state.
class PracticeEntry {
  const PracticeEntry({
    required this.chunk,
    required this.state,
    this.pattern,
    this.appearances = 1,
  });

  final Chunk chunk;
  final UserChunkState state;
  final SentencePattern? pattern;

  /// How many times this chunk has been shown in the current session.
  final int appearances;

  bool get hasSwappableSlot =>
      pattern != null &&
      pattern!.slots.any((slot) => slot.validatedVariants.length > 1);

  PracticeEntry withState(UserChunkState next) => PracticeEntry(
        chunk: chunk,
        state: next,
        pattern: pattern,
        appearances: appearances + 1,
      );
}

/// In-memory queue for one Recall Practice session.
///
/// Chunks whose next review lands within [learnAhead] of "now" are re-queued
/// at the end of the session (learning steps such as 1 m / 10 m), up to
/// [maxAppearances] times, so a forgotten chunk is seen again before leaving.
class PracticeSession {
  PracticeSession({
    required List<PracticeEntry> entries,
    required this.canSpeak,
    PracticeItemFactory itemFactory = const PracticeItemFactory(),
    Random? random,
    this.learnAhead = const Duration(minutes: 20),
    this.maxAppearances = 3,
  })  : _queue = List<PracticeEntry>.from(entries),
        _itemFactory = itemFactory,
        _random = random ?? Random(),
        initialCount = entries.length {
    _prepareCurrent();
  }

  final bool canSpeak;
  final Duration learnAhead;
  final int maxAppearances;
  final int initialCount;

  final List<PracticeEntry> _queue;
  final PracticeItemFactory _itemFactory;
  final Random _random;
  final Map<ReviewRating, int> ratings = <ReviewRating, int>{};

  PracticeItem? _currentItem;
  int _completed = 0;

  bool get isFinished => _queue.isEmpty;
  int get remaining => _queue.length;
  int get completed => _completed;
  PracticeEntry? get current => _queue.isEmpty ? null : _queue.first;
  PracticeItem? get currentItem => _currentItem;

  /// Progress 0–1 based on graded answers versus the work still queued.
  double get progress {
    final total = _completed + _queue.length;
    return total == 0 ? 1 : _completed / total;
  }

  /// Records the grade for the current entry and moves on. Returns true when
  /// the chunk was re-queued for later in this session.
  bool complete(ReviewRating rating, UserChunkState nextState, DateTime now) {
    final entry = _queue.removeAt(0);
    _completed++;
    ratings[rating] = (ratings[rating] ?? 0) + 1;
    var requeued = false;
    final due = nextState.nextReview;
    if (due != null &&
        entry.appearances < maxAppearances &&
        due.isBefore(now.add(learnAhead))) {
      _queue.add(entry.withState(nextState));
      requeued = true;
    }
    _prepareCurrent();
    return requeued;
  }

  /// Drops the current entry without grading it.
  void skip() {
    if (_queue.isEmpty) return;
    _queue.removeAt(0);
    _prepareCurrent();
  }

  void _prepareCurrent() {
    final entry = current;
    if (entry == null) {
      _currentItem = null;
      return;
    }
    final mode = _itemFactory.chooseMode(
      entry.state,
      hasSwappableSlot: entry.hasSwappableSlot,
      canSpeak: canSpeak,
    );
    _currentItem = _itemFactory.build(
      chunk: entry.chunk,
      mode: mode,
      pattern: entry.pattern,
      random: _random,
    );
  }
}
