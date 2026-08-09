import { describe, expect, it } from 'vitest'
import {
  buildGeneratedPack,
  buildPipelineTraces,
  PIPELINE_STEPS,
  PROMPT_VERSIONS,
  SCHEMA_VERSIONS,
} from './generated-pack.js'
import {
  sampleExtractedChunks,
  sampleGenerateRequest,
  sampleGeneratedDialogue,
  sampleNormalizedSituation,
} from './fixtures.js'

describe('buildGeneratedPack', () => {
  it('maps every required relational column from validated AI output', () => {
    const pack = buildGeneratedPack(
      sampleGenerateRequest,
      sampleNormalizedSituation,
      sampleGeneratedDialogue,
      sampleExtractedChunks,
    )

    expect(pack.situation.category).toBe('generated')
    expect(pack.dialogue.createdBy).toBe('ai_generator')
    expect(pack.dialogue.lines.map((line) => line.position)).toEqual([0, 1, 2, 3])
    expect(pack.chunks.length).toBe(3)
    expect(pack.chunks[1].pattern.slots[0].expectedPos).toBe('phrase')
    expect(pack.chunks[1].type).toBe('phrase')
  })

  it('rejects gapped dialogue positions before persistence', () => {
    const dialogue = {
      ...sampleGeneratedDialogue,
      lines: [
        { ...sampleGeneratedDialogue.lines[0], index: 0 },
        { ...sampleGeneratedDialogue.lines[1], index: 2 },
        { ...sampleGeneratedDialogue.lines[2], index: 3 },
        { ...sampleGeneratedDialogue.lines[3], index: 4 },
      ],
    }

    expect(() =>
      buildGeneratedPack(
        sampleGenerateRequest,
        sampleNormalizedSituation,
        dialogue,
        sampleExtractedChunks,
      ),
    ).toThrow('contiguous')
  })
})

describe('buildPipelineTraces', () => {
  it('records allowlisted structured input and validated output for each step', () => {
    const traces = buildPipelineTraces(
      sampleGenerateRequest,
      sampleNormalizedSituation,
      sampleGeneratedDialogue,
      sampleExtractedChunks,
      {
        situation_normalization: 'model-a',
        dialogue_generation: 'model-b',
        chunk_extraction: 'model-c',
      },
    )

    expect(traces.map((trace) => trace.step)).toEqual([...PIPELINE_STEPS])
    expect(traces[0].model).toBe('model-a')
    expect(traces[0].promptVersion).toBe(
      PROMPT_VERSIONS.situation_normalization,
    )
    expect(traces[0].schemaVersion).toBe(
      SCHEMA_VERSIONS.situation_normalization,
    )
    expect(traces[0].input.situation).toBe(sampleGenerateRequest.situation)
    expect(traces[0].output.name).toBe(sampleNormalizedSituation.name)
    expect(traces[2].input.lineCount).toBe(sampleGeneratedDialogue.lines.length)
    expect(traces[2].output.chunks).toHaveLength(sampleExtractedChunks.length)
  })
})
