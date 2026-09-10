import { Cart } from '../../domain/cart/cart'
import { FlavorRepository, ProductRepository } from '../../domain/catalog/catalog.repository'

export interface CartItemView {
  id: string
  productId: string
  productName: string
  flavorId: string | null
  flavorName: string | null
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

export interface CartView {
  id: string
  customerId: string
  items: CartItemView[]
  totalCents: number
  total: number
}

/**
 * Builds a read model for a cart, resolving product/flavor names from their
 * repositories so the API can render the cart without extra round-trips.
 */
export async function buildCartView(
  cart: Cart,
  products: ProductRepository,
  flavors: FlavorRepository,
): Promise<CartView> {
  const items: CartItemView[] = []

  for (const item of cart.items) {
    const product = await products.findById(item.productId)
    const flavor = item.flavorId ? await flavors.findById(item.flavorId) : null

    items.push({
      id: item.id,
      productId: item.productId,
      productName: product?.name ?? '(produto removido)',
      flavorId: item.flavorId,
      flavorName: flavor?.name ?? null,
      quantity: item.quantity,
      unitPriceCents: item.unitPrice.cents,
      subtotalCents: item.subtotal.cents,
    })
  }

  return {
    id: cart.id,
    customerId: cart.customerId,
    items,
    totalCents: cart.total.cents,
    total: cart.total.reais,
  }
}
