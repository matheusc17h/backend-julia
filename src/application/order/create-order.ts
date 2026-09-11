import { CartRepository } from '../../domain/cart/cart.repository'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'
import { Order, OrderItemProps } from '../../domain/order/order'
import { OrderRepository } from '../../domain/order/order.repository'
import { Either, left, right } from '../../shared/either'
import { AppError, ValidationError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'

export interface CreateOrderInput {
  customerId: string
}

export interface CreateOrderOutput {
  order: ReturnType<Order['toPublic']>
}

/**
 * Criação de pedidos a partir do carrinho.
 * Faz um snapshot dos itens (nome + preço atuais), cria o pedido e esvazia o carrinho.
 */
export class CreateOrder {
  constructor(
    private readonly carts: CartRepository,
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly flavors: FlavorRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateOrderInput): Promise<Either<AppError, CreateOrderOutput>> {
    const cart = await this.carts.findByCustomerId(input.customerId)
    if (!cart || cart.isEmpty) {
      return left(new ValidationError('O carrinho está vazio.'))
    }

    const itemProps: OrderItemProps[] = []

    for (const item of cart.items) {
      const product = await this.products.findById(item.productId)
      if (!product) {
        return left(new ValidationError('Um produto do carrinho não existe mais.'))
      }
      if (!product.active) {
        return left(new ValidationError(`O produto "${product.name}" não está mais disponível.`))
      }

      let flavorName: string | null = null
      if (item.flavorId) {
        const flavor = await this.flavors.findById(item.flavorId)
        if (!flavor || !flavor.active) {
          return left(new ValidationError('Um sabor do carrinho não está mais disponível.'))
        }
        flavorName = flavor.name
      }

      itemProps.push({
        id: this.ids.generate(),
        productId: product.id,
        flavorId: item.flavorId,
        productName: product.name,
        flavorName,
        quantity: item.quantity,
        unitPrice: product.price,
      })
    }

    const order = Order.createFromItems({
      id: this.ids.generate(),
      customerId: input.customerId,
      items: itemProps,
    })
    if (!order.ok) return left(order.value)

    // O pagamento via Pix ainda é fictício (não existe provedor real
    // integrado), então tratamos o pedido como pago assim que é criado.
    // Quando entrar um provedor de verdade, isso deve sair daqui e o
    // pedido deve nascer PENDING até chegar o webhook de confirmação.
    const paid = order.value.markPaid()
    if (!paid.ok) return left(paid.value)

    await this.orders.create(order.value)

    cart.clear()
    await this.carts.save(cart)

    return right({ order: order.value.toPublic() })
  }
}
