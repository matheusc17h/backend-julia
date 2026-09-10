/** Hashes and verifies secrets (passwords, recovery codes). */
export interface HashProvider {
  hash(plain: string): Promise<string>
  compare(plain: string, hash: string): Promise<boolean>
}
