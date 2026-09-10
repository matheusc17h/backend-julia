import { Flavor } from './flavor'
import { Product } from './product'

export interface Pagination {
  page: number
  perPage: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  perPage: number
  total: number
}

export interface ListProductsFilter extends Pagination {
  includeInactive: boolean
  search?: string
  category?: string
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>
  list(filter: ListProductsFilter): Promise<Paginated<Product>>
  create(product: Product): Promise<void>
  save(product: Product): Promise<void>
}

export interface ListFlavorsFilter extends Pagination {
  includeInactive: boolean
}

export interface FlavorRepository {
  findById(id: string): Promise<Flavor | null>
  findByName(name: string): Promise<Flavor | null>
  findManyByIds(ids: string[]): Promise<Flavor[]>
  list(filter: ListFlavorsFilter): Promise<Paginated<Flavor>>
  create(flavor: Flavor): Promise<void>
  save(flavor: Flavor): Promise<void>
}
