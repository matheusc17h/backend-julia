import { Customer } from '../../domain/customer/customer'
import { CustomerRepository } from '../../domain/customer/customer.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'

export interface GetCustomerProfileOutput {
  customer: ReturnType<Customer['toPublic']>
}

/** Dados do cliente autenticado (usado pelo frontend para revalidar o token). */
export class GetCustomerProfile {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(input: { customerId: string }): Promise<Either<AppError, GetCustomerProfileOutput>> {
    const customer = await this.customers.findById(input.customerId)
    if (!customer) return left(new NotFoundError('Cliente não encontrado.'))
    return right({ customer: customer.toPublic() })
  }
}
