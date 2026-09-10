export interface PasswordResetCodeProps {
  id: string
  customerId: string
  codeHash: string
  expiresAt: Date
  consumedAt: Date | null
  createdAt: Date
}

/**
 * A hashed, single-use, short-lived code sent to the customer's e-mail during
 * the password recovery flow. The plain code is never persisted.
 */
export class PasswordResetCode {
  private constructor(private props: PasswordResetCodeProps) {}

  static create(input: {
    id: string
    customerId: string
    codeHash: string
    ttlMinutes?: number
    now?: Date
  }): PasswordResetCode {
    const now = input.now ?? new Date()
    const ttl = input.ttlMinutes ?? 15
    return new PasswordResetCode({
      id: input.id,
      customerId: input.customerId,
      codeHash: input.codeHash,
      expiresAt: new Date(now.getTime() + ttl * 60_000),
      consumedAt: null,
      createdAt: now,
    })
  }

  static restore(props: PasswordResetCodeProps): PasswordResetCode {
    return new PasswordResetCode(props)
  }

  get id(): string {
    return this.props.id
  }
  get customerId(): string {
    return this.props.customerId
  }
  get codeHash(): string {
    return this.props.codeHash
  }
  get expiresAt(): Date {
    return this.props.expiresAt
  }
  get consumedAt(): Date | null {
    return this.props.consumedAt
  }

  isExpired(now = new Date()): boolean {
    return now.getTime() > this.props.expiresAt.getTime()
  }

  isConsumed(): boolean {
    return this.props.consumedAt !== null
  }

  isUsable(now = new Date()): boolean {
    return !this.isConsumed() && !this.isExpired(now)
  }

  consume(now = new Date()): void {
    this.props.consumedAt = now
  }
}
