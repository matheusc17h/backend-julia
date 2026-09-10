import { createHmac, timingSafeEqual } from 'node:crypto'
import { TokenPayload, TokenProvider } from '../../application/ports/token-provider'

const encodeSegment = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

/**
 * Compact, stateless token in the JWT (HS256) shape, signed with Node's crypto.
 * Kept dependency-free on purpose; swap for a full JWT library behind the same
 * `TokenProvider` port if you need extra claims/algorithms.
 */
export class HmacTokenProvider implements TokenProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds = 60 * 60 * 24 * 7,
  ) {}

  sign(payload: TokenPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const body = { ...payload, iat: now, exp: now + this.expiresInSeconds }

    const data = `${encodeSegment(header)}.${encodeSegment(body)}`
    const signature = createHmac('sha256', this.secret).update(data).digest('base64url')

    return `${data}.${signature}`
  }

  verify(token: string): TokenPayload | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts
    const expected = createHmac('sha256', this.secret).update(`${header}.${body}`).digest()
    const received = Buffer.from(signature, 'base64url')

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return null
    }

    try {
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload & {
        exp?: number
      }
      if (typeof decoded.exp === 'number' && Math.floor(Date.now() / 1000) >= decoded.exp) {
        return null
      }
      if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') return null
      return { sub: decoded.sub, role: decoded.role }
    } catch {
      return null
    }
  }
}
