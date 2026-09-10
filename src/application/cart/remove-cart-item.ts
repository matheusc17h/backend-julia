import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'
import { buildCartView, CartView } from './cart-view'

export interface RemoveCartItemInput {
  customerId: string
  itemId: string
}

/** Carrinho de compras: remove um item. */
export class RemoveCartItem {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<Either<AppError, CartView>> {
    const cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart) return left(new NotFoundError('Carrinho não encontrado.'))

    const removed = cart.removeItem(input.itemId)
    if (!removed.ok) return left(removed.value)

    await this.carts.save(cart)

    return right(await buildCartView(cart, this.products, this.flavors))
  }
}
