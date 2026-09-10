import { Customer } from '../../domain/customer/customer'
import { CustomerRepository } from '../../domain/customer/customer.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, UnauthorizedError } from '../../shared/errors'
import { HashProvider } from '../ports/hash-provider'
import { TokenProvider } from '../ports/token-provider'

export interface AuthenticateCustomerInput {
  email: string
  password: string
}

export interface AuthenticateCustomerOutput {
  token: string
  customer: ReturnType<Customer['toPublic']>
}

/** Login. */
export class AuthenticateCustomer {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly hasher: HashProvider,
    private readonly tokens: TokenProvider,
  ) {}

  async execute(
    input: AuthenticateCustomerInput,
  ): Promise<Either<AppError, AuthenticateCustomerOutput>> {
    const invalid = new UnauthorizedError('E-mail ou senha inválidos.')

    const customer = await this.customers.findByEmail(input.email.trim().toLowerCase())
    if (!customer) return left(invalid)

    const passwordMatches = await this.hasher.compare(input.password, customer.passwordHash)
    if (!passwordMatches) return left(invalid)

    const token = this.tokens.sign({ sub: customer.id, role: customer.role })

    return right({ token, customer: customer.toPublic() })
  }
}
