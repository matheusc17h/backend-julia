import { Paginated, Pagination } from '../catalog/catalog.repository'

/**
 * Read model usado só pela área administrativa: junta o pedido com os dados
 * de contato do cliente. Não é o agregado `Order` (que não conhece o
 * `Customer`) — é uma projeção de leitura, então vive à parte do
 * `OrderRepository` que serve o caso de uso do próprio cliente.
 */
export interface AdminOrderItemView {
  id: string
  productName: string
  flavorName: string | null
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

export interface AdminOrderView {
  id: string
  status: string
  totalCents: number
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  items: AdminOrderItemView[]
}

export interface AdminOrderSummary {
  totalOrders: number
  totalRevenueCents: number
  uniqueCustomers: number
}

export interface OrderAdminRepository {
  listAll(pagination: Pagination): Promise<Paginated<AdminOrderView>>
  findById(id: string): Promise<AdminOrderView | null>
  summary(): Promise<AdminOrderSummary>
}
