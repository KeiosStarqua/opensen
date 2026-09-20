enum AppThemeMode {
  system('system', 'System'),
  light('light', 'Light'),
  dark('dark', 'Dark');

  const AppThemeMode(this.key, this.label);

  final String key;
  final String label;

  static AppThemeMode fromKey(String? key) => AppThemeMode.values.firstWhere(
        (mode) => mode.key == key,
        orElse: () => AppThemeMode.system,
      );
}

/// Learner preferences. Persisted as flat key/value strings.
class LearnerSettings {
  const LearnerSettings({
    this.goal,
    this.nativeLanguage = 'Vietnamese',
    this.dailyNewLimit = 10,
    this.sessionSize = 20,
    this.desiredRetention = 0.9,
    this.themeMode = AppThemeMode.system,
    this.onboardingComplete = false,
    this.ttsEnabled = true,
    this.speechRate = 0.45,
  });

  factory LearnerSettings.fromMap(Map<String, String> map) {
    const defaults = LearnerSettings();
    return LearnerSettings(
      goal: map['goal'],
      nativeLanguage: map['nativeLanguage'] ?? defaults.nativeLanguage,
      dailyNewLimit:
          int.tryParse(map['dailyNewLimit'] ?? '') ?? defaults.dailyNewLimit,
      sessionSize:
          int.tryParse(map['sessionSize'] ?? '') ?? defaults.sessionSize,
      desiredRetention: double.tryParse(map['desiredRetention'] ?? '') ??
          defaults.desiredRetention,
      themeMode: AppThemeMode.fromKey(map['themeMode']),
      onboardingComplete: map['onboardingComplete'] == 'true',
      ttsEnabled: map['ttsEnabled'] != 'false',
      speechRate:
          double.tryParse(map['speechRate'] ?? '') ?? defaults.speechRate,
    );
  }

  /// Onboarding goal key (a [SituationCategory] key) or null.
  final String? goal;
  final String nativeLanguage;

  /// Maximum never-reviewed chunks introduced per day.
  final int dailyNewLimit;

  /// Maximum chunks per practice session.
  final int sessionSize;

  /// FSRS desired retention 0.70–0.97.
  final double desiredRetention;
  final AppThemeMode themeMode;
  final bool onboardingComplete;
  final bool ttsEnabled;

  /// Text-to-speech rate 0.2–1.0.
  final double speechRate;

  Map<String, String> toMap() => <String, String>{
        if (goal != null) 'goal': goal!,
        'nativeLanguage': nativeLanguage,
        'dailyNewLimit': '$dailyNewLimit',
        'sessionSize': '$sessionSize',
        'desiredRetention': '$desiredRetention',
        'themeMode': themeMode.key,
        'onboardingComplete': '$onboardingComplete',
        'ttsEnabled': '$ttsEnabled',
        'speechRate': '$speechRate',
      };

  LearnerSettings copyWith({
    String? goal,
    String? nativeLanguage,
    int? dailyNewLimit,
    int? sessionSize,
    double? desiredRetention,
    AppThemeMode? themeMode,
    bool? onboardingComplete,
    bool? ttsEnabled,
    double? speechRate,
  }) {
    return LearnerSettings(
      goal: goal ?? this.goal,
      nativeLanguage: nativeLanguage ?? this.nativeLanguage,
      dailyNewLimit: dailyNewLimit ?? this.dailyNewLimit,
      sessionSize: sessionSize ?? this.sessionSize,
      desiredRetention: desiredRetention ?? this.desiredRetention,
      themeMode: themeMode ?? this.themeMode,
      onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      ttsEnabled: ttsEnabled ?? this.ttsEnabled,
      speechRate: speechRate ?? this.speechRate,
    );
  }
}
