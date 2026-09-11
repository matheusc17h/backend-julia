import { Paginated, Pagination } from '../catalog/catalog.repository'
import { OrderRequest } from './order-request'

export interface OrderRequestRepository {
  create(request: OrderRequest): Promise<void>
  list(pagination: Pagination): Promise<Paginated<OrderRequest>>
}
