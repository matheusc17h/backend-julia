import { AdminOrderView, OrderAdminRepository } from '../../domain/order/order-admin-view'
import { OrderRepository } from '../../domain/order/order.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'

export interface ConfirmOrderInput {
  orderId: string
}

export interface ConfirmOrderOutput {
  order: AdminOrderView
}

/** Admin aceita um pedido pago. */
export class ConfirmOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly adminOrders: OrderAdminRepository,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<Either<AppError, ConfirmOrderOutput>> {
    const order = await this.orders.findById(input.orderId)
    if (!order) return left(new NotFoundError('Pedido não encontrado.'))

    const result = order.confirm()
    if (!result.ok) return left(result.value)

    await this.orders.save(order)

    const view = await this.adminOrders.findById(input.orderId)
    return right({ order: view! })
  }
}
