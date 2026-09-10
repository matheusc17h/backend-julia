import { Paginated, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Product } from '../../domain/catalog/product'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListProductsInput {
  page?: number
  perPage?: number
  search?: string
  category?: string
  /** Only an admin is allowed to pass `true` (enforced by the HTTP layer). */
  includeInactive?: boolean
}

export type ListProductsOutput = Paginated<ReturnType<Product['toPublic']>>

/** Gerenciamento de produtos: listagem (catálogo). */
export class ListProducts {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: ListProductsInput): Promise<Either<AppError, ListProductsOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)

    const result = await this.products.list({
      page,
      perPage,
      includeInactive: input.includeInactive ?? false,
      search: input.search?.trim() || undefined,
      category: input.category?.trim().toLowerCase() || undefined,
    })

    return right({
      ...result,
      items: result.items.map((p) => p.toPublic()),
    })
  }
}
