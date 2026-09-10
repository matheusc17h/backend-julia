import { Cart } from './cart'

export interface CartRepository {
  findByCustomerId(customerId: string): Promise<Cart | null>
  create(cart: Cart): Promise<void>
  /** Upserts the cart row and fully replaces its item lines. */
  save(cart: Cart): Promise<void>
}
