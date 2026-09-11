import { AdminOrderView, OrderAdminRepository } from '../../domain/order/order-admin-view'
import { OrderRepository } from '../../domain/order/order.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'

export interface DenyOrderInput {
  orderId: string
}

export interface DenyOrderOutput {
  order: AdminOrderView
  refunded: boolean
  refundedCents: number
}

/**
 * Admin nega um pedido. Se ele já estava pago, o cliente precisa ser
 * reembolsado — como ainda não existe um provedor de pagamento real
 * integrado, o estorno aqui é FICTÍCIO: só sinalizamos no resultado
 * (`refunded`/`refundedCents`) pra interface avisar o admin. Quando
 * integrar um provedor de verdade, é aqui que entra a chamada real de
 * estorno, antes de salvar o pedido como cancelado.
 */
export class DenyOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly adminOrders: OrderAdminRepository,
  ) {}

  async execute(input: DenyOrderInput): Promise<Either<AppError, DenyOrderOutput>> {
    const order = await this.orders.findById(input.orderId)
    if (!order) return left(new NotFoundError('Pedido não encontrado.'))

    const wasPaid = order.status === 'PAID'

    const result = order.cancel()
    if (!result.ok) return left(result.value)

    await this.orders.save(order)

    const view = await this.adminOrders.findById(input.orderId)
    return right({
      order: view!,
      refunded: wasPaid,
      refundedCents: wasPaid ? view!.totalCents : 0,
    })
  }
}
