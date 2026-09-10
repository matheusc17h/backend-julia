import { Cart } from '../../domain/cart/cart'
import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, NotFoundError, ValidationError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'
import { buildCartView, CartView } from './cart-view'

export interface AddCartItemInput {
  customerId: string
  productId: string
  flavorId?: string | null
  quantity: number
}

/** Carrinho de compras: adiciona um item. */
export class AddCartItem {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AddCartItemInput): Promise<Either<AppError, CartView>> {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      return left(new ValidationError('A quantidade deve ser um inteiro maior ou igual a 1.'))
    }

    const product = await this.products.findById(input.productId)
    if (!product) return left(new NotFoundError('Produto não encontrado.'))
    if (!product.active) return left(new ValidationError('Este produto não está disponível.'))

    const flavorId = input.flavorId ?? null

    if (product.requiresFlavor && !flavorId) {
      return left(new ValidationError('Este produto exige a escolha de um sabor.'))
    }
    if (flavorId) {
      if (!product.offersFlavor(flavorId)) {
        return left(new ValidationError('O sabor informado não está disponível para este produto.'))
      }
      const flavor = await this.flavors.findById(flavorId)
      if (!flavor) return left(new NotFoundError('Sabor não encontrado.'))
      if (!flavor.active) return left(new ValidationError('Este sabor não está disponível.'))
    }

    let cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart) {
      cart = Cart.create({ id: this.ids.generate(), customerId: input.customerId })
    }

    cart.addItem({
      id: this.ids.generate(),
      productId: product.id,
      flavorId,
      quantity: input.quantity,
      unitPrice: product.price,
    })

    await this.carts.save(cart)

    return right(await buildCartView(cart, this.products, this.flavors))
  }
}
