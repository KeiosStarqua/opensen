import 'dart:convert';

import '../../domain/entities/chunk.dart';
import '../../domain/entities/dialogue.dart';
import '../../domain/entities/register.dart';
import '../../domain/entities/sentence_pattern.dart';
import '../../domain/entities/situation.dart';
import '../../domain/services/slot_template.dart';

class SeedIntent {
  const SeedIntent({required this.id, required this.name, this.description});

  final String id;
  final String name;
  final String? description;
}

/// Parsed `assets/seed/content.json`: the curated template graph that ships
/// with the app. Ids are authored in the JSON so re-seeding is idempotent;
/// slot and variant ids are derived deterministically from their parents.
class SeedBundle {
  const SeedBundle({
    required this.version,
    required this.intents,
    required this.situations,
    required this.patterns,
    required this.chunks,
    required this.dialogues,
  });

  factory SeedBundle.parse(String jsonText) =>
      SeedBundle.fromJson(jsonDecode(jsonText) as Map<String, dynamic>);

  factory SeedBundle.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.utc(2026, 1, 1);
    final version = json['version'] as int;

    final intents = <SeedIntent>[
      for (final raw in _list(json['intents']))
        SeedIntent(
          id: raw['id'] as String,
          name: raw['name'] as String,
          description: raw['description'] as String?,
        ),
    ];
    final intentIdByName = <String, String>{
      for (final intent in intents) intent.name: intent.id,
    };

    final situations = <Situation>[
      for (final raw in _list(json['situations']))
        Situation(
          id: raw['id'] as String,
          name: raw['name'] as String,
          description: raw['description'] as String? ?? '',
          category: SituationCategory.fromKey(raw['category'] as String?),
          roleSelf: raw['roleSelf'] as String? ?? '',
          roleOther: raw['roleOther'] as String? ?? '',
          goal: raw['goal'] as String? ?? '',
          tone: Register.fromKey(raw['tone'] as String?),
          level: raw['level'] as String? ?? 'B1',
          isTemplate: true,
          prompts: <SlotPrompt>[
            for (final prompt in _list(raw['prompts'])) SlotPrompt.fromJson(prompt),
          ],
          createdAt: createdAt,
        ),
    ];

    final patterns = <SentencePattern>[];
    for (final raw in _list(json['patterns'])) {
      final patternId = raw['id'] as String;
      final slots = <PatternSlot>[];
      var position = 0;
      for (final rawSlot in _list(raw['slots'])) {
        final name = rawSlot['name'] as String;
        final slotId = '${patternId}__$name';
        final variants = <SlotVariant>[];
        var variantIndex = 0;
        for (final rawVariant in _list(rawSlot['variants'])) {
          variants.add(
            SlotVariant(
              id: '${slotId}__$variantIndex',
              slotId: slotId,
              text: rawVariant['text'] as String,
              meaning: rawVariant['meaning'] as String?,
              level: rawVariant['level'] as String?,
              isValidated: rawVariant['isValidated'] as bool? ?? true,
              position: variantIndex,
            ),
          );
          variantIndex++;
        }
        slots.add(
          PatternSlot(
            id: slotId,
            patternId: patternId,
            name: name,
            position: position++,
            expectedPos: rawSlot['expectedPos'] as String?,
            variants: variants,
          ),
        );
      }
      final intentNames = <String>[
        for (final name in _list<String>(raw['intents']))
          if (intentIdByName.containsKey(name)) name,
      ];
      patterns.add(
        SentencePattern(
          id: patternId,
          template: raw['template'] as String,
          meaning: raw['meaning'] as String? ?? '',
          difficulty: raw['difficulty'] as int? ?? 2,
          level: raw['level'] as String? ?? 'B1',
          register: Register.fromKey(raw['register'] as String?),
          isTemplate: true,
          slots: slots,
          intentNames: intentNames,
          situationIds: _list<String>(raw['situations']),
        ),
      );
    }
    final patternsById = <String, SentencePattern>{
      for (final pattern in patterns) pattern.id: pattern,
    };

    final chunks = <Chunk>[
      for (final raw in _list(json['chunks']))
        _chunkFromJson(raw, patternsById, createdAt),
    ];

    final dialogues = <Dialogue>[];
    for (final raw in _list(json['dialogues'])) {
      final dialogueId = raw['id'] as String;
      final lines = <DialogueLine>[];
      var position = 0;
      for (final rawLine in _list(raw['lines'])) {
        lines.add(
          DialogueLine(
            id: '${dialogueId}__$position',
            dialogueId: dialogueId,
            position: position,
            speaker: Speaker.fromKey(rawLine['speaker'] as String?),
            text: rawLine['text'] as String,
            chunkIds: _list<String>(rawLine['chunkIds']),
          ),
        );
        position++;
      }
      dialogues.add(
        Dialogue(
          id: dialogueId,
          situationId: raw['situationId'] as String,
          title: raw['title'] as String,
          level: raw['level'] as String? ?? 'B1',
          createdBy: 'seed',
          isTemplate: true,
          createdAt: createdAt,
          lines: lines,
        ),
      );
    }

    return SeedBundle(
      version: version,
      intents: intents,
      situations: situations,
      patterns: patterns,
      chunks: chunks,
      dialogues: dialogues,
    );
  }

  final int version;
  final List<SeedIntent> intents;
  final List<Situation> situations;
  final List<SentencePattern> patterns;
  final List<Chunk> chunks;
  final List<Dialogue> dialogues;

  /// Authoring-rule violations: dangling references, template chunks whose
  /// text does not match their pattern rendered with default fills, and
  /// dialogue slots that no linked pattern can fill.
  List<String> validate() {
    final problems = <String>[];
    final situationIds = <String>{for (final s in situations) s.id};
    final patternsById = <String, SentencePattern>{
      for (final p in patterns) p.id: p,
    };
    final chunksById = <String, Chunk>{for (final c in chunks) c.id: c};

    for (final pattern in patterns) {
      final declared = SlotTemplate.slotNames(pattern.template).toSet();
      final defined = <String>{for (final slot in pattern.slots) slot.name};
      if (declared.length != defined.length || !declared.containsAll(defined)) {
        problems.add('pattern ${pattern.id}: slots $defined do not match template $declared');
      }
      for (final slot in pattern.slots) {
        if (slot.variants.isEmpty) {
          problems.add('pattern ${pattern.id}: slot ${slot.name} has no variants');
        }
      }
      for (final situationId in pattern.situationIds) {
        if (!situationIds.contains(situationId)) {
          problems.add('pattern ${pattern.id}: unknown situation $situationId');
        }
      }
    }

    for (final chunk in chunks) {
      final patternId = chunk.patternId;
      if (patternId != null) {
        final pattern = patternsById[patternId];
        if (pattern == null) {
          problems.add('chunk ${chunk.id}: unknown pattern $patternId');
        } else if (pattern.render(const <String, String>{}) != chunk.text) {
          problems.add(
            'chunk ${chunk.id}: text "${chunk.text}" is not the pattern rendered '
            'with default fills "${pattern.render(const <String, String>{})}"',
          );
        }
      }
      if (chunk.situationId != null && !situationIds.contains(chunk.situationId)) {
        problems.add('chunk ${chunk.id}: unknown situation ${chunk.situationId}');
      }
    }

    for (final dialogue in dialogues) {
      if (!situationIds.contains(dialogue.situationId)) {
        problems.add('dialogue ${dialogue.id}: unknown situation ${dialogue.situationId}');
      }
      for (final line in dialogue.lines) {
        final fillable = <String>{};
        for (final chunkId in line.chunkIds) {
          final chunk = chunksById[chunkId];
          if (chunk == null) {
            problems.add('dialogue ${dialogue.id} line ${line.position}: unknown chunk $chunkId');
            continue;
          }
          final pattern = chunk.patternId == null ? null : patternsById[chunk.patternId!];
          if (pattern != null) {
            fillable.addAll(pattern.slots.map((slot) => slot.name));
          }
        }
        for (final slot in SlotTemplate.slotNames(line.text)) {
          if (!fillable.contains(slot)) {
            problems.add('dialogue ${dialogue.id} line ${line.position}: slot {$slot} has no pattern behind it');
          }
        }
      }
    }
    return problems;
  }

  static Chunk _chunkFromJson(
    Map<String, dynamic> raw,
    Map<String, SentencePattern> patternsById,
    DateTime createdAt,
  ) {
    final patternId = raw['patternId'] as String?;
    final pattern = patternId == null ? null : patternsById[patternId];
    final text = raw['text'] as String;
    final fills = pattern == null
        ? const <String, String>{}
        : (SlotTemplate.extractFills(pattern.template, text) ?? pattern.defaultFills);
    return Chunk(
      id: raw['id'] as String,
      text: text,
      type: ChunkType.fromKey(raw['type'] as String?),
      meaning: raw['meaning'] as String? ?? '',
      pronunciation: raw['pronunciation'] as String?,
      patternId: patternId,
      level: raw['level'] as String? ?? pattern?.level ?? 'B1',
      register: raw['register'] == null
          ? (pattern?.register ?? Register.neutral)
          : Register.fromKey(raw['register'] as String?),
      situationId: raw['situationId'] as String?,
      isTemplate: true,
      slotFills: fills,
      createdAt: createdAt,
    );
  }

  static List<T> _list<T>(Object? value) =>
      value == null ? <T>[] : (value as List<dynamic>).cast<T>();
}
