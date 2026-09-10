import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError } from '../../shared/errors'
import { buildCartView, CartView } from './cart-view'

export interface UpdateCartItemInput {
  customerId: string
  itemId: string
  quantity: number
}

/** Carrinho de compras: altera a quantidade de um item. */
export class UpdateCartItem {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
  ) {}

  async execute(input: UpdateCartItemInput): Promise<Either<AppError, CartView>> {
    const cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart) return left(new NotFoundError('Carrinho não encontrado.'))

    const changed = cart.changeItemQuantity(input.itemId, input.quantity)
    if (!changed.ok) return left(changed.value)

    await this.carts.save(cart)

    return right(await buildCartView(cart, this.products, this.flavors))
  }
}
