import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose'
import { z } from 'zod'

export type VerifiedIdentity = {
  userId: string
}

/** Resolves a bearer token to a learner identity or throws `InvalidTokenError`. */
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid or expired token') {
    super(message)
    this.name = 'InvalidTokenError'
  }
}

export type NeonAuthVerifierOptions = {
  /** Managed Better Auth URL, e.g. `https://ep-x.neonauth.<region>.aws.neon.tech/neondb/auth`. */
  baseUrl: string
  /** Overrides the remote JWKS lookup (tests). */
  keySet?: JWTVerifyGetKey
}

const subjectSchema = z.string().uuid()

/**
 * Verifies Neon Auth (Managed Better Auth) session JWTs: EdDSA signatures from
 * `<baseUrl>/.well-known/jwks.json`, with `iss` and `aud` bound to this auth instance.
 */
export function createNeonAuthVerifier(
  options: NeonAuthVerifierOptions,
): TokenVerifier {
  const baseUrl = options.baseUrl.replace(/\/$/, '')
  // Neon documents the origin as `iss`, but live tokens carry the full auth URL.
  const instance = [baseUrl, new URL(baseUrl).origin]
  const keySet =
    options.keySet ??
    createRemoteJWKSet(new URL(`${baseUrl}/.well-known/jwks.json`))

  return async (token) => {
    let subject: unknown
    try {
      const { payload } = await jwtVerify(token, keySet, {
        issuer: instance,
        audience: instance,
        algorithms: ['EdDSA'],
      })
      subject = payload.sub
    } catch (error) {
      if (isTokenRejection(error)) {
        throw new InvalidTokenError()
      }
      throw error
    }

    const parsed = subjectSchema.safeParse(subject)
    if (!parsed.success) {
      throw new InvalidTokenError('Token subject is not a learner id')
    }
    return { userId: parsed.data }
  }
}

// JWKS outages are server faults, not bad credentials.
function isTokenRejection(error: unknown): boolean {
  return (
    error instanceof errors.JOSEError &&
    !(error instanceof errors.JWKSTimeout) &&
    !(error instanceof errors.JWKSInvalid)
  )
}
