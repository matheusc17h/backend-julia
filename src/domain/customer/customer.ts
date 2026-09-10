import { Email } from './email'

export type CustomerRole = 'CUSTOMER' | 'ADMIN'

export interface CustomerProps {
  id: string
  name: string
  email: Email
  phone: string | null
  passwordHash: string
  role: CustomerRole
  createdAt: Date
  updatedAt: Date
}

/** Customer aggregate root. */
export class Customer {
  private constructor(private props: CustomerProps) {}

  static create(input: {
    id: string
    name: string
    email: Email
    passwordHash: string
    phone?: string | null
    role?: CustomerRole
    now?: Date
  }): Customer {
    const now = input.now ?? new Date()
    return new Customer({
      id: input.id,
      name: input.name.trim(),
      email: input.email,
      phone: input.phone?.trim() || null,
      passwordHash: input.passwordHash,
      role: input.role ?? 'CUSTOMER',
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: CustomerProps): Customer {
    return new Customer(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get email(): Email {
    return this.props.email
  }
  get phone(): string | null {
    return this.props.phone
  }
  get passwordHash(): string {
    return this.props.passwordHash
  }
  get role(): CustomerRole {
    return this.props.role
  }
  get isAdmin(): boolean {
    return this.props.role === 'ADMIN'
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  changePassword(passwordHash: string, now = new Date()): void {
    this.props.passwordHash = passwordHash
    this.props.updatedAt = now
  }

  updateProfile(data: { name?: string; phone?: string | null }, now = new Date()): void {
    if (data.name !== undefined) this.props.name = data.name.trim()
    if (data.phone !== undefined) this.props.phone = data.phone?.trim() || null
    this.props.updatedAt = now
  }

  /** Safe representation for API responses (never exposes the password hash). */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      phone: this.phone,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
