import { Paginated, Pagination } from '../../../domain/catalog/catalog.repository'
import { OrderRequest, OrderRequestStatus } from '../../../domain/order-request/order-request'
import { OrderRequestRepository } from '../../../domain/order-request/order-request.repository'
import { PrismaClientInstance } from './client'

type Row = {
  id: string
  customerName: string
  whatsapp: string
  productCategory: string
  deliveryDate: Date | null
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: Row): OrderRequest {
  return OrderRequest.restore({
    id: row.id,
    customerName: row.customerName,
    whatsapp: row.whatsapp,
    productCategory: row.productCategory,
    deliveryDate: row.deliveryDate,
    notes: row.notes,
    status: row.status as OrderRequestStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class PrismaOrderRequestRepository implements OrderRequestRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async create(request: OrderRequest): Promise<void> {
    const p = request.toPublic()
    await this.prisma.orderRequest.create({
      data: {
        id: p.id,
        customerName: p.customerName,
        whatsapp: p.whatsapp,
        productCategory: p.productCategory,
        deliveryDate: p.deliveryDate,
        notes: p.notes,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    })
  }

  async list(pagination: Pagination): Promise<Paginated<OrderRequest>> {
    const [rows, total] = await Promise.all([
      this.prisma.orderRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.orderRequest.count(),
    ])
    return {
      items: rows.map(toDomain),
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    }
  }
}
