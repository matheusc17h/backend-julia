import {
  FlavorRepository,
  ListFlavorsFilter,
  Paginated,
} from '../../../domain/catalog/catalog.repository'
import { Flavor } from '../../../domain/catalog/flavor'
import { PrismaClientInstance } from './client'

type Row = {
  id: string
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: Row): Flavor {
  return Flavor.restore({
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class PrismaFlavorRepository implements FlavorRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findById(id: string): Promise<Flavor | null> {
    const row = await this.prisma.flavor.findUnique({ where: { id } })
    return row ? toDomain(row) : null
  }

  async findByName(name: string): Promise<Flavor | null> {
    const row = await this.prisma.flavor.findUnique({ where: { name } })
    return row ? toDomain(row) : null
  }

  async findManyByIds(ids: string[]): Promise<Flavor[]> {
    if (ids.length === 0) return []
    const rows = await this.prisma.flavor.findMany({ where: { id: { in: ids } } })
    return rows.map(toDomain)
  }

  async list(filter: ListFlavorsFilter): Promise<Paginated<Flavor>> {
    const where = filter.includeInactive ? {} : { active: true }
    const [rows, total] = await Promise.all([
      this.prisma.flavor.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filter.page - 1) * filter.perPage,
        take: filter.perPage,
      }),
      this.prisma.flavor.count({ where }),
    ])
    return {
      items: rows.map(toDomain),
      page: filter.page,
      perPage: filter.perPage,
      total,
    }
  }

  async create(flavor: Flavor): Promise<void> {
    await this.prisma.flavor.create({
      data: {
        id: flavor.id,
        name: flavor.name,
        active: flavor.active,
        createdAt: flavor.createdAt,
        updatedAt: flavor.updatedAt,
      },
    })
  }

  async save(flavor: Flavor): Promise<void> {
    await this.prisma.flavor.update({
      where: { id: flavor.id },
      data: {
        name: flavor.name,
        active: flavor.active,
        updatedAt: flavor.updatedAt,
      },
    })
  }
}
