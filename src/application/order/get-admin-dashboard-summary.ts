import { AdminOrderSummary, OrderAdminRepository } from '../../domain/order/order-admin-view'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'

/** Números gerais pra tela inicial do admin: total de pedidos, faturamento, clientes únicos. */
export class GetAdminDashboardSummary {
  constructor(private readonly orders: OrderAdminRepository) {}

  async execute(): Promise<Either<AppError, AdminOrderSummary>> {
    return right(await this.orders.summary())
  }
}
