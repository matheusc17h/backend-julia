import { PasswordResetCode } from '../../../domain/auth/password-reset-code'
import { PasswordResetCodeRepository } from '../../../domain/auth/password-reset-code.repository'
import { PrismaClientInstance } from './client'

type Row = {
  id: string
  customerId: string
  codeHash: string
  expiresAt: Date
  consumedAt: Date | null
  createdAt: Date
}

function toDomain(row: Row): PasswordResetCode {
  return PasswordResetCode.restore({
    id: row.id,
    customerId: row.customerId,
    codeHash: row.codeHash,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
    createdAt: row.createdAt,
  })
}

export class PrismaPasswordResetCodeRepository implements PasswordResetCodeRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async create(code: PasswordResetCode): Promise<void> {
    await this.prisma.passwordResetCode.create({
      data: {
        id: code.id,
        customerId: code.customerId,
        codeHash: code.codeHash,
        expiresAt: code.expiresAt,
        consumedAt: code.consumedAt,
      },
    })
  }

  async save(code: PasswordResetCode): Promise<void> {
    await this.prisma.passwordResetCode.update({
      where: { id: code.id },
      data: { consumedAt: code.consumedAt },
    })
  }

  async findLatestUsableByCustomer(customerId: string): Promise<PasswordResetCode | null> {
    const row = await this.prisma.passwordResetCode.findFirst({
      where: { customerId, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    return row ? toDomain(row) : null
  }

  async invalidateAllForCustomer(customerId: string, now = new Date()): Promise<void> {
    await this.prisma.passwordResetCode.updateMany({
      where: { customerId, consumedAt: null },
      data: { consumedAt: now },
    })
  }
}
