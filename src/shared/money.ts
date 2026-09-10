import { Either, left, right } from './either'
import { ValidationError } from './errors'

/**
 * Money value object. Amounts are kept as an integer number of cents to avoid
 * floating point rounding problems.
 */
export class Money {
  private constructor(public readonly cents: number) {}

  static fromCents(cents: number): Either<ValidationError, Money> {
    if (!Number.isInteger(cents) || cents < 0) {
      return left(new ValidationError('Valor monetário inválido.'))
    }
    return right(new Money(cents))
  }

  /** Trusted factory for values already validated / coming from persistence. */
  static unsafeFromCents(cents: number): Money {
    return new Money(cents)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents)
  }

  multiply(quantity: number): Money {
    return new Money(this.cents * quantity)
  }

  get reais(): number {
    return this.cents / 100
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }
}
