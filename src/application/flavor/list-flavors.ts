import { FlavorRepository, Paginated } from '../../domain/catalog/catalog.repository'
import { Flavor } from '../../domain/catalog/flavor'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListFlavorsInput {
  page?: number
  perPage?: number
  includeInactive?: boolean
}

export type ListFlavorsOutput = Paginated<ReturnType<Flavor['toPublic']>>

/** Gerenciamento de sabores: listagem. */
export class ListFlavors {
  constructor(private readonly flavors: FlavorRepository) {}

  async execute(input: ListFlavorsInput): Promise<Either<AppError, ListFlavorsOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)

    const result = await this.flavors.list({
      page,
      perPage,
      includeInactive: input.includeInactive ?? false,
    })

    return right({
      ...result,
      items: result.items.map((f) => f.toPublic()),
    })
  }
}
