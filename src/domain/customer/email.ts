import { Either, left, right } from '../../shared/either'
import { ValidationError } from '../../shared/errors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** E-mail value object. Always stored normalized (trimmed + lower case). */
export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Either<ValidationError, Email> {
    const normalized = (raw ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(normalized)) {
      return left(new ValidationError('E-mail inválido.'))
    }
    return right(new Email(normalized))
  }

  static unsafe(value: string): Email {
    return new Email(value)
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
