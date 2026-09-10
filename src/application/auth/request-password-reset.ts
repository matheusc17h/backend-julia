import { PasswordResetCode } from '../../domain/auth/password-reset-code'
import { PasswordResetCodeRepository } from '../../domain/auth/password-reset-code.repository'
import { CustomerRepository } from '../../domain/customer/customer.repository'
import { Email } from '../../domain/customer/email'
import { Either, left, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { CodeGenerator, IdGenerator } from '../ports/generators'
import { HashProvider } from '../ports/hash-provider'
import { MailProvider } from '../ports/mail-provider'

export interface RequestPasswordResetInput {
  email: string
}

export interface RequestPasswordResetOutput {
  /** Always true — the response never reveals whether the e-mail exists. */
  delivered: boolean
}

/** Recuperação de senha: gera e envia o código de recuperação por e-mail. */
export class RequestPasswordReset {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly codes: PasswordResetCodeRepository,
    private readonly hasher: HashProvider,
    private readonly mail: MailProvider,
    private readonly ids: IdGenerator,
    private readonly codeGenerator: CodeGenerator,
    private readonly ttlMinutes = 15,
  ) {}

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<Either<AppError, RequestPasswordResetOutput>> {
    const email = Email.create(input.email)
    if (!email.ok) return left(email.value)

    const customer = await this.customers.findByEmail(email.value.value)

    // Do not leak account existence: pretend success when the e-mail is unknown.
    if (!customer) return right({ delivered: true })

    await this.codes.invalidateAllForCustomer(customer.id)

    const plainCode = this.codeGenerator.numeric(6)
    const codeHash = await this.hasher.hash(plainCode)

    const resetCode = PasswordResetCode.create({
      id: this.ids.generate(),
      customerId: customer.id,
      codeHash,
      ttlMinutes: this.ttlMinutes,
    })
    await this.codes.create(resetCode)

    await this.mail.send({
      to: customer.email.value,
      subject: 'Código de recuperação de senha',
      text:
        `Olá, ${customer.name}.\n\n` +
        `Seu código de recuperação é: ${plainCode}\n` +
        `Ele expira em ${this.ttlMinutes} minutos.\n\n` +
        `Se você não solicitou a recuperação, ignore este e-mail.`,
    })

    return right({ delivered: true })
  }
}
