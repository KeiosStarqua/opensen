import '../entities/learner_settings.dart';

abstract class SettingsRepository {
  Future<LearnerSettings> load();

  Future<void> save(LearnerSettings settings);
}
