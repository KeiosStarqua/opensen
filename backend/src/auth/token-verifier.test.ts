import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
} from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'
import { createNeonAuthVerifier, InvalidTokenError } from './token-verifier.js'

const BASE_URL = 'https://ep-test.neonauth.us-east-2.aws.neon.tech/neondb/auth'
const ORIGIN = 'https://ep-test.neonauth.us-east-2.aws.neon.tech'
const USER_ID = '41a5f680-89d2-474d-ae59-e27bfbbbd293'

let privateKey: CryptoKey
let verify: ReturnType<typeof createNeonAuthVerifier>

beforeAll(async () => {
  const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
  privateKey = pair.privateKey
  const jwk = { ...(await exportJWK(pair.publicKey)), alg: 'EdDSA', kid: 'test' }
  verify = createNeonAuthVerifier({
    baseUrl: BASE_URL,
    keySet: createLocalJWKSet({ keys: [jwk] }),
  })
})

function sign(
  overrides: {
    sub?: string
    iss?: string
    aud?: string
    exp?: string | number
    key?: CryptoKey
  } = {},
) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA', kid: 'test' })
    .setSubject(overrides.sub ?? USER_ID)
    .setIssuer(overrides.iss ?? ORIGIN)
    .setAudience(overrides.aud ?? ORIGIN)
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? '15m')
    .sign(overrides.key ?? privateKey)
}

describe('createNeonAuthVerifier', () => {
  it('returns the learner id from a valid token', async () => {
    await expect(verify(await sign())).resolves.toEqual({ userId: USER_ID })
  })

  it('rejects an expired token', async () => {
    const expired = await sign({ exp: Math.floor(Date.now() / 1000) - 60 })
    await expect(verify(expired)).rejects.toBeInstanceOf(InvalidTokenError)
  })

  it('rejects a token from another issuer', async () => {
    const token = await sign({ iss: 'https://evil.example' })
    await expect(verify(token)).rejects.toBeInstanceOf(InvalidTokenError)
  })

  it('rejects a token for another audience', async () => {
    const token = await sign({ aud: 'https://other.example' })
    await expect(verify(token)).rejects.toBeInstanceOf(InvalidTokenError)
  })

  it('rejects a token signed by an unknown key', async () => {
    const other = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
    const token = await sign({ key: other.privateKey })
    await expect(verify(token)).rejects.toBeInstanceOf(InvalidTokenError)
  })

  it('rejects a non-UUID subject', async () => {
    const token = await sign({ sub: 'not-a-uuid' })
    await expect(verify(token)).rejects.toBeInstanceOf(InvalidTokenError)
  })

  it('rejects garbage', async () => {
    await expect(verify('not.a.jwt')).rejects.toBeInstanceOf(InvalidTokenError)
  })
})
