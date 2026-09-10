import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'
import { buildCartView, CartView } from './cart-view'

/** Carrinho de compras: esvazia o carrinho. */
export class ClearCart {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
  ) {}

  async execute(input: { customerId: string }): Promise<Either<AppError, CartView>> {
    const cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart) return left(new NotFoundError('Carrinho não encontrado.'))

    cart.clear()
    await this.carts.save(cart)

    return right(await buildCartView(cart, this.products, this.flavors))
  }
}
