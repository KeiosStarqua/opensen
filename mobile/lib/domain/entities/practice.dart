/// FSRS card state. Stored with the backend-compatible keys
/// `new | learning | review | relearning`.
enum ChunkStatus {
  /// Never reviewed. (`new` is a reserved word in Dart.)
  fresh('new', 'New'),
  learning('learning', 'Learning'),
  review('review', 'Review'),
  relearning('relearning', 'Relearning');

  const ChunkStatus(this.key, this.label);

  final String key;
  final String label;

  static ChunkStatus fromKey(String? key) => ChunkStatus.values.firstWhere(
        (status) => status.key == key,
        orElse: () => ChunkStatus.fresh,
      );
}

/// Learner-facing grade. `forgot` is the FSRS "Again" grade.
enum ReviewRating {
  forgot(1, 'Forgot'),
  hard(2, 'Hard'),
  good(3, 'Good'),
  easy(4, 'Easy');

  const ReviewRating(this.grade, this.label);

  /// Numeric FSRS grade 1–4, stored in review history.
  final int grade;
  final String label;

  static ReviewRating fromGrade(int grade) => ReviewRating.values.firstWhere(
        (rating) => rating.grade == grade,
        orElse: () => ReviewRating.good,
      );
}

/// Per-learner FSRS scheduling state for one chunk. Mutable source of truth;
/// intervals are derived from [stability] at scheduling time, never stored.
class UserChunkState {
  const UserChunkState({
    required this.chunkId,
    required this.status,
    required this.step,
    required this.reps,
    required this.lapses,
    required this.updatedAt,
    this.stability,
    this.difficulty,
    this.lastReview,
    this.nextReview,
  });

  /// State for a chunk that was just added to practice: due immediately.
  factory UserChunkState.initial(String chunkId, DateTime now) =>
      UserChunkState(
        chunkId: chunkId,
        status: ChunkStatus.fresh,
        step: 0,
        reps: 0,
        lapses: 0,
        nextReview: now,
        updatedAt: now,
      );

  final String chunkId;
  final ChunkStatus status;

  /// Index into the learning / relearning steps while not in review.
  final int step;
  final double? stability;
  final double? difficulty;
  final int reps;
  final int lapses;
  final DateTime? lastReview;
  final DateTime? nextReview;
  final DateTime updatedAt;

  bool isDue(DateTime now) => nextReview == null || !nextReview!.isAfter(now);

  UserChunkState copyWith({
    ChunkStatus? status,
    int? step,
    double? stability,
    double? difficulty,
    int? reps,
    int? lapses,
    DateTime? lastReview,
    DateTime? nextReview,
    DateTime? updatedAt,
  }) {
    return UserChunkState(
      chunkId: chunkId,
      status: status ?? this.status,
      step: step ?? this.step,
      stability: stability ?? this.stability,
      difficulty: difficulty ?? this.difficulty,
      reps: reps ?? this.reps,
      lapses: lapses ?? this.lapses,
      lastReview: lastReview ?? this.lastReview,
      nextReview: nextReview ?? this.nextReview,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Append-only review log row. FSRS needs elapsed-time context, not just the
/// grade, so both the actual and the planned interval are kept.
class ReviewRecord {
  const ReviewRecord({
    required this.id,
    required this.chunkId,
    required this.rating,
    required this.elapsedDays,
    required this.scheduledDays,
    required this.stateBefore,
    required this.reviewTime,
    this.practiceAttemptId,
  });

  final String id;
  final String chunkId;
  final ReviewRating rating;
  final int elapsedDays;
  final int scheduledDays;
  final ChunkStatus stateBefore;
  final String? practiceAttemptId;
  final DateTime reviewTime;
}

/// Recall Practice modes. Every mode requires production, not recognition.
enum PracticeMode {
  listenRepeat('listen_repeat', 'Listen & repeat', 'Listen, then say it out loud.'),
  l1ToL2('l1_to_l2', 'Say it from meaning', 'Say the English sentence for this meaning.'),
  cloze('cloze', 'Fill the missing part', 'Say the whole sentence with the missing part.'),
  slotSwap('slot_swap', 'Change one component', 'Keep the frame, swap the slot.');

  const PracticeMode(this.key, this.label, this.instruction);

  final String key;
  final String label;
  final String instruction;

  static PracticeMode fromKey(String? key) => PracticeMode.values.firstWhere(
        (mode) => mode.key == key,
        orElse: () => PracticeMode.l1ToL2,
      );
}

/// A concrete exercise generated from a chunk for one practice mode.
class PracticeItem {
  const PracticeItem({
    required this.chunkId,
    required this.mode,
    required this.prompt,
    required this.expected,
    this.hint,
    this.spokenText,
    this.slotName,
  });

  final String chunkId;
  final PracticeMode mode;

  /// What the learner is shown.
  final String prompt;

  /// Target answer the learner should produce.
  final String expected;

  /// Optional hint; using it is recorded on the attempt.
  final String? hint;

  /// Text to synthesise for listen-and-repeat (null for other modes).
  final String? spokenText;
  final String? slotName;
}

/// What the learner actually produced. Feeds the north-star metric.
class PracticeAttempt {
  const PracticeAttempt({
    required this.id,
    required this.chunkId,
    required this.mode,
    required this.prompt,
    required this.expected,
    required this.usedHint,
    required this.attemptedAt,
    this.transcript,
    this.matchScore,
  });

  final String id;
  final String chunkId;
  final PracticeMode mode;
  final String prompt;
  final String expected;
  final String? transcript;
  final double? matchScore;
  final bool usedHint;
  final DateTime attemptedAt;
}

/// Practice Plan dashboard numbers.
class PlanStats {
  const PlanStats({
    required this.total,
    required this.byStatus,
    required this.dueNow,
    required this.dueNext7Days,
    required this.reviewedToday,
    required this.streakDays,
  });

  static const PlanStats empty = PlanStats(
    total: 0,
    byStatus: <ChunkStatus, int>{},
    dueNow: 0,
    dueNext7Days: <int>[0, 0, 0, 0, 0, 0, 0],
    reviewedToday: 0,
    streakDays: 0,
  );

  final int total;
  final Map<ChunkStatus, int> byStatus;
  final int dueNow;

  /// Due counts for today and the next six days (index 0 = today, including
  /// anything already overdue).
  final List<int> dueNext7Days;
  final int reviewedToday;
  final int streakDays;

  int countFor(ChunkStatus status) => byStatus[status] ?? 0;
}
