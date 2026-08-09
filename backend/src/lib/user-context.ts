import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

const USER_ID_HEADER = 'x-user-id'
const userIdSchema = z.string().uuid()

export function resolveUserId(c: Context): string {
  const raw = c.req.header(USER_ID_HEADER)?.trim()

  if (!raw) {
    throw new HTTPException(401, {
      message: `Missing ${USER_ID_HEADER} header`,
    })
  }

  const parsed = userIdSchema.safeParse(raw)
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `${USER_ID_HEADER} must be a valid UUID`,
    })
  }

  return parsed.data
}
