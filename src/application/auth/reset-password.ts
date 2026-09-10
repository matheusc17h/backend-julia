import { PasswordResetCodeRepository } from '../../domain/auth/password-reset-code.repository'
import { CustomerRepository } from '../../domain/customer/customer.repository'
import { Email } from '../../domain/customer/email'
import { RawPassword } from '../../domain/customer/password-policy'
import { Either, left, right } from '../../shared/either'
import { AppError, UnauthorizedError } from '../../shared/errors'
import { HashProvider } from '../ports/hash-provider'

export interface ResetPasswordInput {
  email: string
  code: string
  newPassword: string
}

export interface ResetPasswordOutput {
  reset: boolean
}

/** Recuperação de senha: valida o código recebido por e-mail e troca a senha. */
export class ResetPassword {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly codes: PasswordResetCodeRepository,
    private readonly hasher: HashProvider,
  ) {}

  async execute(input: ResetPasswordInput): Promise<Either<AppError, ResetPasswordOutput>> {
    const email = Email.create(input.email)
    if (!email.ok) return left(email.value)

    const newPassword = RawPassword.create(input.newPassword)
    if (!newPassword.ok) return left(newPassword.value)

    const invalidCode = new UnauthorizedError('Código inválido ou expirado.')

    const customer = await this.customers.findByEmail(email.value.value)
    if (!customer) return left(invalidCode)

    const resetCode = await this.codes.findLatestUsableByCustomer(customer.id)
    if (!resetCode || !resetCode.isUsable()) return left(invalidCode)

    const codeMatches = await this.hasher.compare(input.code.trim(), resetCode.codeHash)
    if (!codeMatches) return left(invalidCode)

    const passwordHash = await this.hasher.hash(newPassword.value.value)
    customer.changePassword(passwordHash)
    await this.customers.save(customer)

    resetCode.consume()
    await this.codes.save(resetCode)
    await this.codes.invalidateAllForCustomer(customer.id)

    return right({ reset: true })
  }
}
