import { Paginated } from '../../domain/catalog/catalog.repository'
import { AdminOrderView, OrderAdminRepository } from '../../domain/order/order-admin-view'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListAllOrdersInput {
  page?: number
  perPage?: number
}

export type ListAllOrdersOutput = Paginated<AdminOrderView>

/** Lista todos os pedidos de todos os clientes. Uso exclusivo do admin. */
export class ListAllOrders {
  constructor(private readonly orders: OrderAdminRepository) {}

  async execute(input: ListAllOrdersInput): Promise<Either<AppError, ListAllOrdersOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)
    const result = await this.orders.listAll({ page, perPage })
    return right(result)
  }
}
