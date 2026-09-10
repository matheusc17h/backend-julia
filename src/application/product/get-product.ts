import { ProductRepository } from '../../domain/catalog/catalog.repository'
import { Product } from '../../domain/catalog/product'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'

export interface GetProductOutput {
  product: ReturnType<Product['toPublic']>
}

export class GetProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: { id: string }): Promise<Either<AppError, GetProductOutput>> {
    const product = await this.products.findById(input.id)
    if (!product) return left(new NotFoundError('Produto não encontrado.'))
    return right({ product: product.toPublic() })
  }
}
