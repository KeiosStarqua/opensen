import { sql } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import {
  chunks,
  dialogues,
  dialogueLines,
  intents,
  lineChunks,
  patternIntents,
  patternSlots,
  sentencePatterns,
  situations,
  slotVariants,
} from '../db/schema/index.js'
import { uuidFromSeed } from '../content/seed-id.js'
import { loadMobileSeedBundle, type MobileSeedBundle } from './mobile-bundle.js'

export type ImportMobileCatalogResult = {
  situations: number
  intents: number
  patterns: number
  chunks: number
  dialogues: number
}

export async function importMobileCatalog(
  database: Database,
  bundle: MobileSeedBundle = loadMobileSeedBundle(),
): Promise<ImportMobileCatalogResult> {
  const intentIdByName = new Map<string, string>()
  for (const intent of bundle.intents) {
    intentIdByName.set(intent.name, uuidFromSeed('int', intent.id))
  }

  await database.transaction(async (tx) => {
    for (const intent of bundle.intents) {
      await tx
        .insert(intents)
        .values({
          id: uuidFromSeed('int', intent.id),
          name: intent.name,
          description: intent.description,
        })
        .onConflictDoNothing()
    }

    for (const situation of bundle.situations) {
      await tx
        .insert(situations)
        .values({
          id: uuidFromSeed('sit', situation.id),
          name: situation.name,
          description: situation.description,
          category: situation.category,
          roleSelf: situation.roleSelf,
          roleOther: situation.roleOther,
          goal: situation.goal,
          tone: situation.tone,
          ownerId: null,
          visibility: 'public',
          sourceTemplateId: null,
        })
        .onConflictDoNothing()
    }

    for (const pattern of bundle.patterns) {
      const patternId = uuidFromSeed('pat', pattern.id)
      await tx
        .insert(sentencePatterns)
        .values({
          id: patternId,
          template: pattern.template,
          meaning: pattern.meaning,
          difficulty: String(pattern.difficulty),
          level: pattern.level,
          register: pattern.register,
          ownerId: null,
          visibility: 'public',
          sourceTemplateId: null,
        })
        .onConflictDoNothing()

      for (const [position, slot] of pattern.slots.entries()) {
        const slotId = uuidFromSeed('slot', `${pattern.id}:${slot.name}`)
        await tx
          .insert(patternSlots)
          .values({
            id: slotId,
            patternId,
            name: slot.name,
            position,
            expectedPos: slot.expectedPos,
          })
          .onConflictDoNothing()

        for (const [index, variant] of slot.variants.entries()) {
          await tx
            .insert(slotVariants)
            .values({
              id: uuidFromSeed('var', `${pattern.id}:${slot.name}:${index}`),
              slotId,
              text: variant.text,
              meaning: variant.meaning ?? variant.text,
              level: pattern.level,
              isValidated: true,
            })
            .onConflictDoNothing()
        }
      }

      for (const intentName of pattern.intents) {
        const intentId = intentIdByName.get(intentName)
        if (!intentId) continue
        for (const sitAuthored of pattern.situations) {
          await tx
            .insert(patternIntents)
            .values({
              patternId,
              intentId,
              situationId: uuidFromSeed('sit', sitAuthored),
            })
            .onConflictDoNothing()
        }
      }
    }

    const patternById = new Map(bundle.patterns.map((p) => [p.id, p]))

    for (const chunk of bundle.chunks) {
      const pattern = chunk.patternId
        ? patternById.get(chunk.patternId)
        : undefined
      await tx
        .insert(chunks)
        .values({
          id: uuidFromSeed('chk', chunk.id),
          text: chunk.text,
          type: chunk.type ?? 'phrase',
          meaning: chunk.meaning,
          pronunciation: null,
          patternId: chunk.patternId
            ? uuidFromSeed('pat', chunk.patternId)
            : null,
          level: chunk.level ?? pattern?.level ?? 'B1',
          register: chunk.register ?? pattern?.register ?? 'neutral',
          ownerId: null,
          visibility: 'public',
          sourceTemplateId: null,
        })
        .onConflictDoNothing()
    }

    for (const dialogue of bundle.dialogues) {
      const dialogueId = uuidFromSeed('dlg', dialogue.id)
      await tx
        .insert(dialogues)
        .values({
          id: dialogueId,
          situationId: uuidFromSeed('sit', dialogue.situationId),
          title: dialogue.title,
          level: dialogue.level,
          createdBy: 'seed',
          requestId: null,
          ownerId: null,
          visibility: 'public',
          sourceTemplateId: null,
        })
        .onConflictDoNothing()

      for (const [position, line] of dialogue.lines.entries()) {
        const lineId = uuidFromSeed('line', `${dialogue.id}:${position}`)
        await tx
          .insert(dialogueLines)
          .values({
            id: lineId,
            dialogueId,
            position,
            speaker: line.speaker,
            text: line.text,
          })
          .onConflictDoNothing()

        for (const chunkAuthored of line.chunkIds ?? []) {
          await tx
            .insert(lineChunks)
            .values({
              lineId,
              chunkId: uuidFromSeed('chk', chunkAuthored),
            })
            .onConflictDoNothing()
        }
      }
    }
  })

  return {
    situations: bundle.situations.length,
    intents: bundle.intents.length,
    patterns: bundle.patterns.length,
    chunks: bundle.chunks.length,
    dialogues: bundle.dialogues.length,
  }
}

/** Idempotent marker row count for smoke checks after manual seed. */
export async function countPublicSituations(database: Database): Promise<number> {
  const rows = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(situations)
    .where(sql`${situations.visibility} = 'public'`)
  return rows[0]?.count ?? 0
}
