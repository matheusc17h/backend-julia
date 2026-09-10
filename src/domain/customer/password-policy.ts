import { Either, left, right } from '../../shared/either'
import { ValidationError } from '../../shared/errors'

/**
 * A raw (plain text) password that satisfies the domain password policy.
 * It only lives long enough to be handed to the hash provider.
 */
export class RawPassword {
  private constructor(public readonly value: string) {}

  static create(raw: string): Either<ValidationError, RawPassword> {
    if (typeof raw !== 'string' || raw.length < 8) {
      return left(new ValidationError('A senha deve ter ao menos 8 caracteres.'))
    }
    if (!/[a-zA-Z]/.test(raw) || !/[0-9]/.test(raw)) {
      return left(new ValidationError('A senha deve conter letras e números.'))
    }
    return right(new RawPassword(raw))
  }
}
