import { Order } from '../../domain/order/order'
import { OrderRepository } from '../../domain/order/order.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors'

export interface GetOrderInput {
  orderId: string
  requesterId: string
  requesterIsAdmin: boolean
}

export interface GetOrderOutput {
  order: ReturnType<Order['toPublic']>
}

/** Detalhe de um pedido. Somente o dono ou um admin podem consultar. */
export class GetOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: GetOrderInput): Promise<Either<AppError, GetOrderOutput>> {
    const order = await this.orders.findById(input.orderId)
    if (!order) return left(new NotFoundError('Pedido não encontrado.'))

    if (!input.requesterIsAdmin && order.customerId !== input.requesterId) {
      return left(new ForbiddenError('Você não tem permissão para ver este pedido.'))
    }

    return right({ order: order.toPublic() })
  }
}
