import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Product } from '../../domain/catalog/product'
import { Either, left, right } from '../../shared/either'
import { AppError, ValidationError } from '../../shared/errors'
import { Money } from '../../shared/money'
import { IdGenerator } from '../ports/generators'

export interface CreateProductInput {
  name: string
  description?: string | null
  priceCents: number
  active?: boolean
  category?: string | null
  imageUrl?: string | null
  flavorIds?: string[]
}

export interface CreateProductOutput {
  product: ReturnType<Product['toPublic']>
}

/** Cadastro de novos produtos pelo administrador. */
export class CreateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateProductInput): Promise<Either<AppError, CreateProductOutput>> {
    if (!input.name || input.name.trim().length < 2) {
      return left(new ValidationError('Informe um nome de produto válido.'))
    }

    const price = Money.fromCents(input.priceCents)
    if (!price.ok) return left(price.value)

    const flavorIds = [...new Set(input.flavorIds ?? [])]
    const unknownFlavors = await this.assertFlavorsExist(flavorIds)
    if (unknownFlavors) return left(unknownFlavors)

    const product = Product.create({
      id: this.ids.generate(),
      name: input.name,
      description: input.description ?? null,
      price: price.value,
      active: input.active,
      category: input.category ?? null,
      imageUrl: input.imageUrl ?? null,
      flavorIds,
    })

    await this.products.create(product)

    return right({ product: product.toPublic() })
  }

  private async assertFlavorsExist(flavorIds: string[]): Promise<ValidationError | null> {
    if (flavorIds.length === 0) return null
    const found = await this.flavors.findManyByIds(flavorIds)
    if (found.length !== flavorIds.length) {
      return new ValidationError('Um ou mais sabores informados não existem.')
    }
    return null
  }
}
