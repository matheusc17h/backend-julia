import { AdminOrderView, OrderAdminRepository } from '../../domain/order/order-admin-view'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'

export interface GetAdminOrderInput {
  orderId: string
}

export interface GetAdminOrderOutput {
  order: AdminOrderView
}

/** Detalhe de um pedido com dados do cliente. Uso exclusivo do admin. */
export class GetAdminOrder {
  constructor(private readonly orders: OrderAdminRepository) {}

  async execute(input: GetAdminOrderInput): Promise<Either<AppError, GetAdminOrderOutput>> {
    const order = await this.orders.findById(input.orderId)
    if (!order) return left(new NotFoundError('Pedido não encontrado.'))
    return right({ order })
  }
}
