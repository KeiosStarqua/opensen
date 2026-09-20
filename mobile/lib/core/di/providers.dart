import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite_common/sqlite_api.dart';

import '../../data/repositories/sqlite_content_repository.dart';
import '../../data/repositories/sqlite_practice_repository.dart';
import '../../data/repositories/sqlite_settings_repository.dart';
import '../../domain/entities/learner_settings.dart';
import '../../domain/repositories/content_repository.dart';
import '../../domain/repositories/practice_repository.dart';
import '../../domain/repositories/settings_repository.dart';
import '../../domain/services/clock.dart';
import '../../domain/services/fsrs/fsrs_parameters.dart';
import '../../domain/services/fsrs/fsrs_scheduler.dart';
import '../../domain/services/id_generator.dart';
import '../../domain/usecases/build_dialogue.dart';
import '../../domain/usecases/create_custom_chunk.dart';
import '../../domain/usecases/export_anki.dart';
import '../../domain/usecases/record_review.dart';
import '../../domain/usecases/start_practice_session.dart';
import '../platform/export_sink.dart';
import '../platform/speech_synthesizer.dart';
import '../util/uuid_id_generator.dart';

// ----------------------------------------------------------------------------
// Composition root. `main` overrides the two "must be provided" providers
// (database, initial settings); tests override repositories with fakes.
// ----------------------------------------------------------------------------

final databaseProvider = Provider<Database>(
  (ref) => throw StateError(
    'databaseProvider must be overridden at the root ProviderScope',
  ),
);

/// Settings loaded during bootstrap; the mutable state lives in
/// [settingsProvider].
final initialSettingsProvider = Provider<LearnerSettings>(
  (ref) => const LearnerSettings(),
);

final clockProvider = Provider<Clock>((ref) => const SystemClock());

final idGeneratorProvider = Provider<IdGenerator>(
  (ref) => const UuidIdGenerator(),
);

final contentRepositoryProvider = Provider<ContentRepository>(
  (ref) => SqliteContentRepository(
    ref.watch(databaseProvider),
    ids: ref.watch(idGeneratorProvider),
  ),
);

final practiceRepositoryProvider = Provider<PracticeRepository>(
  (ref) => SqlitePracticeRepository(ref.watch(databaseProvider)),
);

final settingsRepositoryProvider = Provider<SettingsRepository>(
  (ref) => SqliteSettingsRepository(ref.watch(databaseProvider)),
);

final speechSynthesizerProvider = Provider<SpeechSynthesizer>((ref) {
  final synthesizer = FlutterTtsSynthesizer();
  ref.onDispose(synthesizer.dispose);
  return synthesizer;
});

final exportSinkProvider = Provider<ExportSink>((ref) => const ShareExportSink());

// ------------------------------------------------------------------- settings

class SettingsController extends Notifier<LearnerSettings> {
  @override
  LearnerSettings build() => ref.watch(initialSettingsProvider);

  Future<void> update(LearnerSettings Function(LearnerSettings) change) async {
    final next = change(state);
    state = next;
    await ref.read(settingsRepositoryProvider).save(next);
  }
}

final settingsProvider = NotifierProvider<SettingsController, LearnerSettings>(
  SettingsController.new,
);

final schedulerProvider = Provider<FsrsScheduler>((ref) {
  final retention =
      ref.watch(settingsProvider.select((s) => s.desiredRetention));
  return FsrsScheduler(FsrsParameters(desiredRetention: retention));
});

// ------------------------------------------------------------------ use cases

final buildDialogueUseCaseProvider = Provider<BuildDialogueUseCase>(
  (ref) => BuildDialogueUseCase(
    content: ref.watch(contentRepositoryProvider),
    ids: ref.watch(idGeneratorProvider),
    clock: ref.watch(clockProvider),
  ),
);

final startPracticeSessionUseCaseProvider =
    Provider<StartPracticeSessionUseCase>(
  (ref) => StartPracticeSessionUseCase(
    content: ref.watch(contentRepositoryProvider),
    practice: ref.watch(practiceRepositoryProvider),
    clock: ref.watch(clockProvider),
  ),
);

final recordReviewUseCaseProvider = Provider<RecordReviewUseCase>(
  (ref) => RecordReviewUseCase(
    practice: ref.watch(practiceRepositoryProvider),
    scheduler: ref.watch(schedulerProvider),
    clock: ref.watch(clockProvider),
    ids: ref.watch(idGeneratorProvider),
  ),
);

final exportAnkiUseCaseProvider = Provider<ExportAnkiUseCase>(
  (ref) => ExportAnkiUseCase(
    content: ref.watch(contentRepositoryProvider),
    practice: ref.watch(practiceRepositoryProvider),
  ),
);

final createCustomChunkUseCaseProvider = Provider<CreateCustomChunkUseCase>(
  (ref) => CreateCustomChunkUseCase(
    content: ref.watch(contentRepositoryProvider),
    ids: ref.watch(idGeneratorProvider),
    clock: ref.watch(clockProvider),
  ),
);
