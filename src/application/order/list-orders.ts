import { Paginated } from '../../domain/catalog/catalog.repository'
import { Order } from '../../domain/order/order'
import { OrderRepository } from '../../domain/order/order.repository'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListOrdersInput {
  customerId: string
  page?: number
  perPage?: number
}

export type ListOrdersOutput = Paginated<ReturnType<Order['toPublic']>>

/** Lista os pedidos do cliente autenticado. */
export class ListOrders {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: ListOrdersInput): Promise<Either<AppError, ListOrdersOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)
    const result = await this.orders.listByCustomer(input.customerId, { page, perPage })
    return right({
      ...result,
      items: result.items.map((o) => o.toPublic()),
    })
  }
}
