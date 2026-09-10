import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { HashProvider } from '../../application/ports/hash-provider'

const scryptAsync = promisify(scrypt)

/**
 * Password/secret hashing backed by Node's built-in scrypt.
 * Stored format: `scrypt$<saltHex>$<hashHex>`.
 */
export class CryptoHashProvider implements HashProvider {
  private readonly keyLength = 64

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derived = (await scryptAsync(plain, salt, this.keyLength)) as Buffer
    return `scrypt$${salt}$${derived.toString('hex')}`
  }

  async compare(plain: string, stored: string): Promise<boolean> {
    const [scheme, salt, hash] = stored.split('$')
    if (scheme !== 'scrypt' || !salt || !hash) return false

    const derived = (await scryptAsync(plain, salt, this.keyLength)) as Buffer
    const expected = Buffer.from(hash, 'hex')

    return expected.length === derived.length && timingSafeEqual(expected, derived)
  }
}
