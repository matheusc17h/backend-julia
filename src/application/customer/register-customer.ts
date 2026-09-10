import { Customer } from '../../domain/customer/customer'
import { CustomerRepository } from '../../domain/customer/customer.repository'
import { Email } from '../../domain/customer/email'
import { RawPassword } from '../../domain/customer/password-policy'
import { Either, left, right } from '../../shared/either'
import { AppError, ConflictError, ValidationError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'
import { HashProvider } from '../ports/hash-provider'

export interface RegisterCustomerInput {
  name: string
  email: string
  password: string
  phone?: string | null
}

export interface RegisterCustomerOutput {
  customer: ReturnType<Customer['toPublic']>
}

/** Cadastro de clientes. */
export class RegisterCustomer {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly hasher: HashProvider,
    private readonly ids: IdGenerator,
  ) {}

  async execute(
    input: RegisterCustomerInput,
  ): Promise<Either<AppError, RegisterCustomerOutput>> {
    const email = Email.create(input.email)
    if (!email.ok) return left(email.value)

    const password = RawPassword.create(input.password)
    if (!password.ok) return left(password.value)

    if (!input.name || input.name.trim().length < 2) {
      return left(new ValidationError('Informe um nome válido.'))
    }

    const alreadyExists = await this.customers.findByEmail(email.value.value)
    if (alreadyExists) {
      return left(new ConflictError('Já existe um cliente com este e-mail.'))
    }

    const passwordHash = await this.hasher.hash(password.value.value)

    const customer = Customer.create({
      id: this.ids.generate(),
      name: input.name,
      email: email.value,
      phone: input.phone ?? null,
      passwordHash,
      role: 'CUSTOMER',
    })

    await this.customers.create(customer)

    return right({ customer: customer.toPublic() })
  }
}
