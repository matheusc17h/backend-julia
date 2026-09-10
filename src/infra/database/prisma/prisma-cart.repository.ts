import { Cart, CartItem } from '../../../domain/cart/cart'
import { CartRepository } from '../../../domain/cart/cart.repository'
import { Money } from '../../../shared/money'
import { PrismaClientInstance } from './client'

type ItemRow = {
  id: string
  productId: string
  flavorId: string | null
  quantity: number
  unitPriceCents: number
}

type CartRow = {
  id: string
  customerId: string
  createdAt: Date
  updatedAt: Date
  items: ItemRow[]
}

function toDomain(row: CartRow): Cart {
  const items = row.items.map(
    (i) =>
      new CartItem({
        id: i.id,
        productId: i.productId,
        flavorId: i.flavorId,
        quantity: i.quantity,
        unitPrice: Money.unsafeFromCents(i.unitPriceCents),
      }),
  )
  return Cart.restore(
    { id: row.id, customerId: row.customerId, createdAt: row.createdAt, updatedAt: row.updatedAt },
    items,
  )
}

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findByCustomerId(customerId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({
      where: { customerId },
      include: { items: true },
    })
    return row ? toDomain(row) : null
  }

  async create(cart: Cart): Promise<void> {
    await this.prisma.cart.create({
      data: {
        id: cart.id,
        customerId: cart.customerId,
        items: {
          create: cart.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            flavorId: i.flavorId,
            quantity: i.quantity,
            unitPriceCents: i.unitPrice.cents,
          })),
        },
      },
    })
  }

  /** Upsert the cart row and fully replace its item lines. */
  async save(cart: Cart): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cart.upsert({
        where: { id: cart.id },
        create: { id: cart.id, customerId: cart.customerId },
        update: { updatedAt: new Date() },
      }),
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cartItem.createMany({
        data: cart.items.map((i) => ({
          id: i.id,
          cartId: cart.id,
          productId: i.productId,
          flavorId: i.flavorId,
          quantity: i.quantity,
          unitPriceCents: i.unitPrice.cents,
        })),
      }),
    ])
  }
}
