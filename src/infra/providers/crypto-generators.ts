import { randomInt, randomUUID } from 'node:crypto'
import { CodeGenerator, IdGenerator } from '../../application/ports/generators'

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID()
  }
}

export class CryptoCodeGenerator implements CodeGenerator {
  numeric(length: number): string {
    let out = ''
    for (let i = 0; i < length; i++) {
      out += randomInt(0, 10).toString()
    }
    return out
  }
}
