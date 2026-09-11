import { Pagination, Paginated } from '../../../domain/catalog/catalog.repository'
import {
  AdminOrderSummary,
  AdminOrderView,
  OrderAdminRepository,
} from '../../../domain/order/order-admin-view'
import { PrismaClientInstance } from './client'

const include = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  items: true,
} as const

type Row = {
  id: string
  status: string
  createdAt: Date
  updatedAt: Date
  customer: { id: string; name: string; email: string; phone: string | null }
  items: {
    id: string
    productName: string
    flavorName: string | null
    quantity: number
    unitPriceCents: number
  }[]
}

function toView(row: Row): AdminOrderView {
  const items = row.items.map((i) => ({
    id: i.id,
    productName: i.productName,
    flavorName: i.flavorName,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
    subtotalCents: i.unitPriceCents * i.quantity,
  }))
  return {
    id: row.id,
    status: row.status,
    totalCents: items.reduce((sum, i) => sum + i.subtotalCents, 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customer: row.customer,
    items,
  }
}

export class PrismaOrderAdminRepository implements OrderAdminRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async listAll(pagination: Pagination): Promise<Paginated<AdminOrderView>> {
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        include,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.order.count(),
    ])
    return {
      items: rows.map(toView),
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    }
  }

  async findById(id: string): Promise<AdminOrderView | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include })
    return row ? toView(row) : null
  }

  async summary(): Promise<AdminOrderSummary> {
    const [totalOrders, revenue, customers] = await Promise.all([
      this.prisma.order.count(),
      // Só conta como faturamento o que está (ou ficou) efetivamente pago —
      // pedido negado/cancelado não é receita, mesmo que tenha sido pago
      // (o valor foi/deveria ser estornado).
      this.prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ['PAID', 'CONFIRMED'] } },
      }),
      this.prisma.order.findMany({ distinct: ['customerId'], select: { customerId: true } }),
    ])
    return {
      totalOrders,
      totalRevenueCents: revenue._sum.totalCents ?? 0,
      uniqueCustomers: customers.length,
    }
  }
}
