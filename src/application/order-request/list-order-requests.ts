import { Paginated } from '../../domain/catalog/catalog.repository'
import { OrderRequest } from '../../domain/order-request/order-request'
import { OrderRequestRepository } from '../../domain/order-request/order-request.repository'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListOrderRequestsInput {
  page?: number
  perPage?: number
}

export type ListOrderRequestsOutput = Paginated<ReturnType<OrderRequest['toPublic']>>

/** Lista os pedidos de contato recebidos pelo formulário público. Uso do admin. */
export class ListOrderRequests {
  constructor(private readonly requests: OrderRequestRepository) {}

  async execute(input: ListOrderRequestsInput): Promise<Either<AppError, ListOrderRequestsOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)
    const result = await this.requests.list({ page, perPage })
    return right({ ...result, items: result.items.map((r) => r.toPublic()) })
  }
}
