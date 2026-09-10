import { Paginated, Pagination } from '../catalog/catalog.repository'
import { Order } from './order'

export interface OrderRepository {
  findById(id: string): Promise<Order | null>
  listByCustomer(customerId: string, pagination: Pagination): Promise<Paginated<Order>>
  create(order: Order): Promise<void>
}
