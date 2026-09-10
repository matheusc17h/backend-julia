import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Product } from '../../domain/catalog/product'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError, ValidationError } from '../../shared/errors'
import { Money } from '../../shared/money'

export interface UpdateProductInput {
  id: string
  name?: string
  description?: string | null
  priceCents?: number
  active?: boolean
  category?: string | null
  imageUrl?: string | null
  flavorIds?: string[]
}

export interface UpdateProductOutput {
  product: ReturnType<Product['toPublic']>
}

/** Edição de produtos pelo administrador. */
export class UpdateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
  ) {}

  async execute(input: UpdateProductInput): Promise<Either<AppError, UpdateProductOutput>> {
    const product = await this.products.findById(input.id)
    if (!product) return left(new NotFoundError('Produto não encontrado.'))

    let price: Money | undefined
    if (input.priceCents !== undefined) {
      const parsed = Money.fromCents(input.priceCents)
      if (!parsed.ok) return left(parsed.value)
      price = parsed.value
    }

    let flavorIds: string[] | undefined
    if (input.flavorIds !== undefined) {
      flavorIds = [...new Set(input.flavorIds)]
      if (flavorIds.length > 0) {
        const found = await this.flavors.findManyByIds(flavorIds)
        if (found.length !== flavorIds.length) {
          return left(new ValidationError('Um ou mais sabores informados não existem.'))
        }
      }
    }

    product.update({
      name: input.name,
      description: input.description,
      price,
      active: input.active,
      category: input.category,
      imageUrl: input.imageUrl,
      flavorIds,
    })

    await this.products.save(product)

    return right({ product: product.toPublic() })
  }
}
