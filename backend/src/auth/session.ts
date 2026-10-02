import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { InvalidTokenError, type TokenVerifier } from './token-verifier.js'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string | null
  }
}

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i

/**
 * Resolves the caller from `Authorization: Bearer <jwt>`.
 * No header: anonymous. Malformed, invalid, or expired token: 401.
 * Token sent while auth is unconfigured (`verifier` null): 503.
 */
export function authenticate(verifier: TokenVerifier | null): MiddlewareHandler {
  return async (c, next) => {
    c.set('userId', await resolveCaller(c.req.header('authorization'), verifier))
    await next()
  }
}

/** Signed-in learner id, or 401 when the request is anonymous. */
export function requireUserId(c: Context): string {
  const userId = optionalUserId(c)
  if (!userId) {
    throw new HTTPException(401, { message: 'Sign-in required' })
  }
  return userId
}

/** Signed-in learner id, or null for anonymous requests. */
export function optionalUserId(c: Context): string | null {
  return c.get('userId') ?? null
}

async function resolveCaller(
  header: string | undefined,
  verifier: TokenVerifier | null,
): Promise<string | null> {
  if (!header?.trim()) return null

  const token = BEARER_PATTERN.exec(header.trim())?.[1]
  if (!token) {
    throw new HTTPException(401, {
      message: 'Authorization header must use the Bearer scheme',
    })
  }
  if (!verifier) {
    throw new HTTPException(503, { message: 'Authentication is not configured' })
  }

  try {
    return (await verifier(token)).userId
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw new HTTPException(401, { message: error.message })
    }
    throw error
  }
}
