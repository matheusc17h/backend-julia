import { Customer, CustomerRole } from '../../../domain/customer/customer'
import { CustomerRepository } from '../../../domain/customer/customer.repository'
import { Email } from '../../../domain/customer/email'
import { PrismaClientInstance } from './client'

type Row = {
  id: string
  name: string
  email: string
  phone: string | null
  passwordHash: string
  role: string
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: Row): Customer {
  return Customer.restore({
    id: row.id,
    name: row.name,
    email: Email.unsafe(row.email),
    phone: row.phone,
    passwordHash: row.passwordHash,
    role: (row.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER') as CustomerRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { id } })
    return row ? toDomain(row) : null
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { email } })
    return row ? toDomain(row) : null
  }

  async create(customer: Customer): Promise<void> {
    await this.prisma.customer.create({
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email.value,
        phone: customer.phone,
        passwordHash: customer.passwordHash,
        role: customer.role,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    })
  }

  async save(customer: Customer): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customer.name,
        phone: customer.phone,
        passwordHash: customer.passwordHash,
        role: customer.role,
        updatedAt: customer.updatedAt,
      },
    })
  }
}
