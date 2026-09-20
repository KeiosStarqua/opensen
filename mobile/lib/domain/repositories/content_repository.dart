import '../entities/chunk.dart';
import '../entities/dialogue.dart';
import '../entities/sentence_pattern.dart';
import '../entities/situation.dart';
import '../services/dialogue_composer.dart';

/// Read/write access to the local content knowledge graph: situations,
/// patterns (with slots and variants), chunks and dialogues.
abstract class ContentRepository {
  /// [templates] filters to seed templates (true) or learner instances
  /// (false); null returns both.
  Future<List<Situation>> listSituations({bool? templates});

  Future<Situation?> getSituation(String id);

  /// Patterns with slots and variants loaded. [situationId] restricts to
  /// patterns linked to that situation template.
  Future<List<SentencePattern>> listPatterns({
    String? situationId,
    Set<String>? ids,
  });

  Future<SentencePattern?> getPattern(String id);

  /// [query] matches chunk text or meaning, case-insensitively.
  Future<List<Chunk>> listChunks({
    String? situationId,
    String? patternId,
    String? query,
    Set<String>? ids,
  });

  Future<Chunk?> getChunk(String id);

  Future<Chunk?> findChunkByText(String text);

  Future<List<Dialogue>> listDialogues({String? situationId, bool? templates});

  /// Dialogue with lines and their chunk links.
  Future<Dialogue?> getDialogue(String id);

  /// Persists a Dialog Builder result atomically.
  Future<void> saveComposedDialogue(ComposedDialogue composed);

  Future<void> deleteDialogue(String id);

  /// Inserts a pattern together with its slots and variants.
  Future<void> savePattern(SentencePattern pattern);

  /// Inserts or updates a chunk.
  Future<void> saveChunk(Chunk chunk);

  /// Removes a chunk and everything that references it (practice state,
  /// history, dialogue links).
  Future<void> deleteChunk(String id);

  /// Adds a learner variant to a slot. Returns the stored variant.
  Future<SlotVariant> addSlotVariant(
    String slotId,
    String text, {
    String? meaning,
    bool isValidated = false,
  });
}
