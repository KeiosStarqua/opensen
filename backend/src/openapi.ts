/**
 * OpenAPI 3.1 description of the OpenSen HTTP API.
 *
 * Hand-authored to mirror the routes in `src/routes/*` and their Zod schemas.
 * Kept as an edge concern (docs) so route handlers stay free of doc plumbing.
 * When a route's contract changes, update the matching entry here.
 */

const REGISTERS = ['casual', 'neutral', 'polite', 'formal'] as const
const CHUNK_REGISTERS = ['casual', 'neutral', 'formal'] as const
const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'] as const
const REVIEW_RATINGS = ['forgot', 'hard', 'good', 'easy'] as const

const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    status: { type: 'integer' },
  },
  required: ['error', 'status'],
} as const

const userIdHeader = {
  name: 'X-User-Id',
  in: 'header',
  required: true,
  description: 'Learner UUID. Identifies the owner for user-scoped operations.',
  schema: { type: 'string', format: 'uuid' },
} as const

const optionalUserIdHeader = {
  ...userIdHeader,
  required: false,
  description:
    'Optional learner UUID. When present, responses include per-user state (e.g. enrollment).',
} as const

const limitParam = {
  name: 'limit',
  in: 'query',
  required: false,
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
} as const

const cursorParam = {
  name: 'cursor',
  in: 'query',
  required: false,
  description: 'Opaque pagination cursor (UUID of the last seen item).',
  schema: { type: 'string', format: 'uuid' },
} as const

export function buildOpenApiDocument(baseUrl?: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'OpenSen API',
      version: '1.0.0',
      description:
        'HTTP API for OpenSen (Open Sentence) — situational speaking-reflex ' +
        'training via the chunking method. Serves the mobile/web clients for ' +
        'situations, chunk library, AI dialogue generation, FSRS practice, and ' +
        'Anki export.\n\n' +
        'User-scoped endpoints require an `X-User-Id` header (learner UUID) ' +
        'until authenticated ownership ships.',
    },
    servers: [
      { url: baseUrl ?? 'https://api.opensen.taquangkhoi.com', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Local dev (vercel dev)' },
    ],
    tags: [
      { name: 'Meta', description: 'Service metadata and health.' },
      { name: 'Situations', description: 'Real-world scenarios and their intents.' },
      { name: 'Chunks', description: 'High-frequency phrases with swap patterns.' },
      { name: 'Dialogues', description: 'AI-generated memorization-ready dialogs.' },
      { name: 'Practice', description: 'FSRS spaced-repetition review on chunks.' },
      { name: 'Export', description: 'Export chunks to external study tools.' },
    ],
    paths: {
      '/': {
        get: {
          tags: ['Meta'],
          summary: 'Service index',
          description: 'Returns the service name and a map of top-level surfaces.',
          responses: {
            '200': {
              description: 'Service metadata.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Meta'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      service: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                    required: ['ok', 'service', 'timestamp'],
                  },
                },
              },
            },
          },
        },
      },
      '/health/db': {
        get: {
          tags: ['Meta'],
          summary: 'Database readiness check',
          description:
            'Confirms DATABASE_URL is configured and the database accepts a query. Every /api/* route depends on this; check it first when routes return a generic 500.',
          responses: {
            '200': {
              description: 'Database is reachable.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      service: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                    required: ['ok', 'service', 'timestamp'],
                  },
                },
              },
            },
            '503': {
              description: 'DATABASE_URL is missing/invalid, or the database query failed.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      service: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      error: { type: 'string' },
                      detail: { type: 'string' },
                    },
                    required: ['ok', 'service', 'timestamp', 'error'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/situations': {
        get: {
          tags: ['Situations'],
          summary: 'List situations',
          parameters: [limitParam, cursorParam],
          responses: {
            '200': {
              description: 'A page of situations.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SituationList' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/situations/{id}': {
        get: {
          tags: ['Situations'],
          summary: 'Get situation detail',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Situation detail.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/situations/{id}/intents': {
        get: {
          tags: ['Situations'],
          summary: 'List intents for a situation',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Intents belonging to the situation.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { items: { type: 'array', items: { type: 'object' } } },
                    required: ['items'],
                  },
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/chunks': {
        get: {
          tags: ['Chunks'],
          summary: 'List chunks',
          parameters: [
            limitParam,
            cursorParam,
            { name: 'q', in: 'query', required: false, description: 'Free-text search.', schema: { type: 'string' } },
            { name: 'register', in: 'query', required: false, schema: { type: 'string' } },
            optionalUserIdHeader,
          ],
          responses: {
            '200': {
              description: 'A page of chunks.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
        post: {
          tags: ['Chunks'],
          summary: 'Create a chunk',
          parameters: [userIdHeader],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateChunk' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Chunk created.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/chunks/{id}': {
        get: {
          tags: ['Chunks'],
          summary: 'Get chunk detail',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            optionalUserIdHeader,
          ],
          responses: {
            '200': { description: 'Chunk detail.', content: { 'application/json': { schema: { type: 'object' } } } },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Chunks'],
          summary: 'Update a chunk',
          description: 'Update text and/or meaning. At least one field is required.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            userIdHeader,
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', minLength: 1 },
                    meaning: { type: 'string', minLength: 1 },
                  },
                  minProperties: 1,
                },
              },
            },
          },
          responses: {
            '200': { description: 'Chunk updated.', content: { 'application/json': { schema: { type: 'object' } } } },
            '400': { $ref: '#/components/responses/BadRequest' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/chunks/{id}/patterns': {
        get: {
          tags: ['Chunks'],
          summary: 'Get patterns for a chunk',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Patterns for the chunk.', content: { 'application/json': { schema: { type: 'object' } } } },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/chunks/patterns/{patternId}': {
        get: {
          tags: ['Chunks'],
          summary: 'Get a pattern by id',
          parameters: [{ name: 'patternId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Pattern detail.',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { pattern: { type: 'object' } }, required: ['pattern'] },
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/dialogues': {
        get: {
          tags: ['Dialogues'],
          summary: 'List dialogues',
          description:
            'Returns persisted dialogues. When dialogue persistence is disabled, ' +
            'returns an empty page.',
          responses: {
            '200': {
              description: 'A page of dialogues (possibly empty).',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/dialogues/{id}': {
        get: {
          tags: ['Dialogues'],
          summary: 'Get dialogue detail',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Dialogue detail.', content: { 'application/json': { schema: { type: 'object' } } } },
            '404': { $ref: '#/components/responses/NotFound' },
            '501': {
              description: 'Dialogue persistence is disabled.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/dialogues/generate': {
        post: {
          tags: ['Dialogues'],
          summary: 'Generate a dialogue pack',
          description:
            'Runs the AI pipeline to produce a memorization-ready dialogue plus ' +
            'extracted chunks. Persists and enrolls chunks when persistence is enabled.',
          parameters: [optionalUserIdHeader],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenerateDialogueRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Generated dialogue pack.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/practice/due': {
        get: {
          tags: ['Practice'],
          summary: 'List due reviews',
          parameters: [
            userIdHeader,
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            cursorParam,
          ],
          responses: {
            '200': { description: 'Chunks due for review.', content: { 'application/json': { schema: { type: 'object' } } } },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/practice/reviews': {
        post: {
          tags: ['Practice'],
          summary: 'Record a review',
          parameters: [userIdHeader],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReviewRequest' },
              },
            },
          },
          responses: {
            '201': { description: 'Review recorded; next schedule returned.', content: { 'application/json': { schema: { type: 'object' } } } },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/practice/plan': {
        get: {
          tags: ['Practice'],
          summary: 'Get practice plan stats',
          parameters: [userIdHeader],
          responses: {
            '200': { description: 'Aggregate plan statistics.', content: { 'application/json': { schema: { type: 'object' } } } },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/export/anki': {
        get: {
          tags: ['Export'],
          summary: 'Export chunks as an Anki deck',
          description:
            'Returns a tab-separated Anki import file. When the learner has no ' +
            'matching notes, returns `{ empty: true, noteCount: 0 }` as JSON.',
          parameters: [
            userIdHeader,
            {
              name: 'scope',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['enrolled', 'all'], default: 'enrolled' },
            },
          ],
          responses: {
            '200': {
              description: 'Anki deck file, or an empty-set JSON marker.',
              content: {
                'text/plain': { schema: { type: 'string' } },
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { empty: { type: 'boolean' }, noteCount: { type: 'integer' } },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },
    components: {
      responses: {
        BadRequest: {
          description: 'Invalid request.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: 'Missing or invalid X-User-Id header.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Resource not found.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
      schemas: {
        Error: errorResponse,
        SituationList: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            nextCursor: { type: ['string', 'null'] },
          },
        },
        CreateChunk: {
          type: 'object',
          required: ['text', 'meaning', 'register', 'level', 'template', 'patternMeaning', 'slots'],
          properties: {
            text: { type: 'string', minLength: 1 },
            meaning: { type: 'string', minLength: 1 },
            register: { type: 'string', enum: [...REGISTERS] },
            level: { type: 'string', minLength: 1 },
            template: { type: 'string', minLength: 1 },
            patternMeaning: { type: 'string', minLength: 1 },
            slots: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['name', 'position', 'variants'],
                properties: {
                  name: { type: 'string', minLength: 1 },
                  position: { type: 'integer', minimum: 0 },
                  expectedPos: { type: 'string', default: 'noun' },
                  variants: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['text', 'meaning'],
                      properties: {
                        text: { type: 'string', minLength: 1 },
                        meaning: { type: 'string', minLength: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        GenerateDialogueRequest: {
          type: 'object',
          required: ['situation'],
          properties: {
            situation: { type: 'string', minLength: 3, maxLength: 2000 },
            nativeLanguage: { type: 'string', minLength: 2, maxLength: 32, default: 'vi' },
            targetLanguage: { type: 'string', minLength: 2, maxLength: 32, default: 'zh' },
            level: { type: 'string', enum: [...LEVELS], default: 'beginner' },
            role: { type: 'string', maxLength: 200 },
            otherSpeaker: { type: 'string', maxLength: 200 },
            goal: { type: 'string', maxLength: 500 },
            tone: { type: 'string', maxLength: 100 },
          },
        },
        ReviewRequest: {
          type: 'object',
          required: ['chunkId', 'rating'],
          properties: {
            chunkId: { type: 'string', format: 'uuid' },
            rating: { type: 'string', enum: [...REVIEW_RATINGS] },
            practiceAttemptId: { type: 'string', format: 'uuid' },
          },
        },
        ChunkRegister: { type: 'string', enum: [...CHUNK_REGISTERS] },
      },
    },
  } as const
}

export type OpenApiDocument = ReturnType<typeof buildOpenApiDocument>
