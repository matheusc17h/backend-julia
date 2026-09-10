import { Pagination, Paginated } from '../../../domain/catalog/catalog.repository'
import { Order, OrderItem, OrderStatus } from '../../../domain/order/order'
import { OrderRepository } from '../../../domain/order/order.repository'
import { Money } from '../../../shared/money'
import { PrismaClientInstance } from './client'

type ItemRow = {
  id: string
  productId: string
  flavorId: string | null
  productName: string
  flavorName: string | null
  quantity: number
  unitPriceCents: number
}

type OrderRow = {
  id: string
  customerId: string
  status: string
  createdAt: Date
  updatedAt: Date
  items: ItemRow[]
}

function toDomain(row: OrderRow): Order {
  const items = row.items.map((i) =>
    OrderItem.create({
      id: i.id,
      productId: i.productId,
      flavorId: i.flavorId,
      productName: i.productName,
      flavorName: i.flavorName,
      quantity: i.quantity,
      unitPrice: Money.unsafeFromCents(i.unitPriceCents),
    }),
  )
  return Order.restore(
    {
      id: row.id,
      customerId: row.customerId,
      status: row.status as OrderStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    items,
  )
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } })
    return row ? toDomain(row) : null
  }

  async listByCustomer(customerId: string, pagination: Pagination): Promise<Paginated<Order>> {
    const where = { customerId }
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.order.count({ where }),
    ])
    return {
      items: rows.map(toDomain),
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    }
  }

  async create(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        totalCents: order.total.cents,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: {
          create: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            flavorId: i.flavorId,
            productName: i.productName,
            flavorName: i.flavorName,
            quantity: i.quantity,
            unitPriceCents: i.unitPrice.cents,
          })),
        },
      },
    })
  }
}
