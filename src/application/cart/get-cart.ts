import { Cart } from '../../domain/cart/cart'
import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'
import { buildCartView, CartView } from './cart-view'

/** Carrinho de compras: consulta o carrinho atual do cliente (cria se não existir). */
export class GetCart {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: { customerId: string }): Promise<Either<AppError, CartView>> {
    let cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart) {
      cart = Cart.create({ id: this.ids.generate(), customerId: input.customerId })
      await this.carts.create(cart)
    }
    return right(await buildCartView(cart, this.products, this.flavors))
  }
}
