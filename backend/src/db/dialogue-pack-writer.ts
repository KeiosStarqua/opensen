import type { Database } from './client.js'
import { isNeonHostedDatabaseUrl } from './client.js'
import type {
  GeneratedPack,
  PersistenceProjection,
  PipelineTrace,
} from '../dialogue-packs/generated-pack.js'
import {
  aiGenerations,
  chunks,
  dialogueLines,
  dialogues,
  patternSlots,
  sentencePatterns,
  situations,
  slotVariants,
} from './schema/index.js'

export type DialoguePackWriter = {
  persist(
    pack: GeneratedPack,
    traces: PipelineTrace[],
    requestId?: string,
  ): Promise<PersistenceProjection>
}

type AllocatedIds = {
  requestId: string
  situationId: string
  dialogueId: string
  lineIds: string[]
  patternIds: string[]
  slotIds: string[][]
  variantIds: string[][][]
  chunkIds: string[]
  generationIds: string[]
}

function allocateIds(
  pack: GeneratedPack,
  traces: PipelineTrace[],
  requestId: string,
): AllocatedIds {
  const patternIds = pack.chunks.map(() => crypto.randomUUID())
  const slotIds = pack.chunks.map((chunk) =>
    chunk.pattern.slots.map(() => crypto.randomUUID()),
  )
  const variantIds = pack.chunks.map((chunk, chunkIndex) =>
    chunk.pattern.slots.map((slot, slotIndex) =>
      slot.variants.map(() => crypto.randomUUID()),
    ),
  )

  return {
    requestId,
    situationId: crypto.randomUUID(),
    dialogueId: crypto.randomUUID(),
    lineIds: pack.dialogue.lines.map(() => crypto.randomUUID()),
    patternIds,
    slotIds,
    variantIds,
    chunkIds: pack.chunks.map(() => crypto.randomUUID()),
    generationIds: traces.map(() => crypto.randomUUID()),
  }
}

function buildRows(
  pack: GeneratedPack,
  traces: PipelineTrace[],
  ids: AllocatedIds,
) {
  const situationRow = {
    id: ids.situationId,
    name: pack.situation.name,
    description: pack.situation.description,
    category: pack.situation.category,
    roleSelf: pack.situation.roleSelf,
    roleOther: pack.situation.roleOther,
    goal: pack.situation.goal,
    tone: pack.situation.tone,
  }

  const dialogueRow = {
    id: ids.dialogueId,
    situationId: ids.situationId,
    title: pack.dialogue.title,
    level: pack.dialogue.level,
    createdBy: pack.dialogue.createdBy,
    requestId: ids.requestId,
  }

  const lineRows = pack.dialogue.lines.map((line, index) => ({
    id: ids.lineIds[index],
    dialogueId: ids.dialogueId,
    position: line.position,
    speaker: line.speaker,
    text: line.text,
  }))

  const patternRows = pack.chunks.map((chunk, chunkIndex) => ({
    id: ids.patternIds[chunkIndex],
    template: chunk.pattern.template,
    meaning: chunk.pattern.meaning,
    difficulty: chunk.pattern.difficulty,
    level: chunk.pattern.level,
    register: chunk.pattern.register,
  }))

  const slotRows = pack.chunks.flatMap((chunk, chunkIndex) =>
    chunk.pattern.slots.map((slot, slotIndex) => ({
      id: ids.slotIds[chunkIndex][slotIndex],
      patternId: ids.patternIds[chunkIndex],
      name: slot.name,
      position: slot.position,
      expectedPos: slot.expectedPos,
    })),
  )

  const variantRows = pack.chunks.flatMap((chunk, chunkIndex) =>
    chunk.pattern.slots.flatMap((slot, slotIndex) =>
      slot.variants.map((variant, variantIndex) => ({
        id: ids.variantIds[chunkIndex][slotIndex][variantIndex],
        slotId: ids.slotIds[chunkIndex][slotIndex],
        text: variant.text,
        meaning: variant.meaning,
        level: variant.level,
        isValidated: false,
      })),
    ),
  )

  const chunkRows = pack.chunks.map((chunk, chunkIndex) => ({
    id: ids.chunkIds[chunkIndex],
    text: chunk.text,
    type: chunk.type,
    meaning: chunk.meaning,
    pronunciation: chunk.pronunciation,
    patternId: ids.patternIds[chunkIndex],
    level: chunk.level,
    register: chunk.register,
  }))

  const generationRows = traces.map((trace, index) => ({
    id: ids.generationIds[index],
    requestId: ids.requestId,
    step: trace.step,
    model: trace.model,
    promptVersion: trace.promptVersion,
    schemaVersion: trace.schemaVersion,
    input: trace.input,
    output: trace.output,
    validationVerdict: trace.validationVerdict,
  }))

  return {
    situationRow,
    dialogueRow,
    lineRows,
    patternRows,
    slotRows,
    variantRows,
    chunkRows,
    generationRows,
  }
}

async function persistWithTransaction(
  database: Database,
  pack: GeneratedPack,
  traces: PipelineTrace[],
  requestId?: string,
): Promise<PersistenceProjection> {
  const ids = allocateIds(pack, traces, requestId ?? crypto.randomUUID())
  const rows = buildRows(pack, traces, ids)

  await database.transaction(async (tx) => {
    await tx.insert(situations).values(rows.situationRow)
    await tx.insert(sentencePatterns).values(rows.patternRows)
    if (rows.slotRows.length > 0) {
      await tx.insert(patternSlots).values(rows.slotRows)
    }
    if (rows.variantRows.length > 0) {
      await tx.insert(slotVariants).values(rows.variantRows)
    }
    await tx.insert(chunks).values(rows.chunkRows)
    await tx.insert(dialogues).values(rows.dialogueRow)
    await tx.insert(dialogueLines).values(rows.lineRows)
    await tx.insert(aiGenerations).values(rows.generationRows)
  })

  return {
    requestId: ids.requestId,
    situationId: ids.situationId,
    dialogueId: ids.dialogueId,
    chunkIds: ids.chunkIds,
  }
}

async function persistWithBatch(
  database: Database,
  pack: GeneratedPack,
  traces: PipelineTrace[],
  requestId?: string,
): Promise<PersistenceProjection> {
  const ids = allocateIds(pack, traces, requestId ?? crypto.randomUUID())
  const rows = buildRows(pack, traces, ids)

  const queries: unknown[] = [
    database.insert(situations).values(rows.situationRow),
    database.insert(sentencePatterns).values(rows.patternRows),
  ]

  if (rows.slotRows.length > 0) {
    queries.push(database.insert(patternSlots).values(rows.slotRows))
  }
  if (rows.variantRows.length > 0) {
    queries.push(database.insert(slotVariants).values(rows.variantRows))
  }

  queries.push(
    database.insert(chunks).values(rows.chunkRows),
    database.insert(dialogues).values(rows.dialogueRow),
    database.insert(dialogueLines).values(rows.lineRows),
    database.insert(aiGenerations).values(rows.generationRows),
  )

  const neonDatabase = database as Database & {
    batch: (statements: unknown[]) => Promise<unknown>
  }
  await neonDatabase.batch(queries)

  return {
    requestId: ids.requestId,
    situationId: ids.situationId,
    dialogueId: ids.dialogueId,
    chunkIds: ids.chunkIds,
  }
}

export function createDialoguePackWriter(
  database: Database,
  databaseUrl: string,
): DialoguePackWriter {
  const useBatch = isNeonHostedDatabaseUrl(databaseUrl)

  return {
    persist: (pack, traces, requestId) =>
      useBatch
        ? persistWithBatch(database, pack, traces, requestId)
        : persistWithTransaction(database, pack, traces, requestId),
  }
}
