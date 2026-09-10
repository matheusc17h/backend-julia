import {
  ListProductsFilter,
  Paginated,
  ProductRepository,
} from '../../../domain/catalog/catalog.repository'
import { Product } from '../../../domain/catalog/product'
import { Money } from '../../../shared/money'
import { PrismaClientInstance } from './client'

type Row = {
  id: string
  name: string
  description: string | null
  priceCents: number
  active: boolean
  category: string | null
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
  flavors?: { flavorId: string }[]
}

function toDomain(row: Row): Product {
  return Product.restore({
    id: row.id,
    name: row.name,
    description: row.description,
    price: Money.unsafeFromCents(row.priceCents),
    active: row.active,
    category: row.category,
    imageUrl: row.imageUrl,
    flavorIds: (row.flavors ?? []).map((f) => f.flavorId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: { flavors: { select: { flavorId: true } } },
    })
    return row ? toDomain(row) : null
  }

  async list(filter: ListProductsFilter): Promise<Paginated<Product>> {
    const where = {
      ...(filter.includeInactive ? {} : { active: true }),
      ...(filter.search ? { name: { contains: filter.search } } : {}),
      ...(filter.category ? { category: filter.category } : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { flavors: { select: { flavorId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.perPage,
        take: filter.perPage,
      }),
      this.prisma.product.count({ where }),
    ])

    return {
      items: rows.map(toDomain),
      page: filter.page,
      perPage: filter.perPage,
      total,
    }
  }

  async create(product: Product): Promise<void> {
    await this.prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.price.cents,
        active: product.active,
        category: product.category,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        flavors: {
          create: [...product.flavorIds].map((flavorId) => ({ flavorId })),
        },
      },
    })
  }

  async save(product: Product): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: product.id },
        data: {
          name: product.name,
          description: product.description,
          priceCents: product.price.cents,
          active: product.active,
          category: product.category,
          imageUrl: product.imageUrl,
          updatedAt: product.updatedAt,
        },
      }),
      this.prisma.productFlavor.deleteMany({ where: { productId: product.id } }),
      this.prisma.productFlavor.createMany({
        data: [...product.flavorIds].map((flavorId) => ({ productId: product.id, flavorId })),
      }),
    ])
  }
}
