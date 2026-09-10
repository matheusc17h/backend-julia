import { Either, left, right } from '../../shared/either'
import { NotFoundError, ValidationError } from '../../shared/errors'
import { Money } from '../../shared/money'

export interface CartItemProps {
  id: string
  productId: string
  flavorId: string | null
  quantity: number
  unitPrice: Money
}

export class CartItem {
  constructor(private props: CartItemProps) {}

  get id(): string {
    return this.props.id
  }
  get productId(): string {
    return this.props.productId
  }
  get flavorId(): string | null {
    return this.props.flavorId
  }
  get quantity(): number {
    return this.props.quantity
  }
  get unitPrice(): Money {
    return this.props.unitPrice
  }
  get subtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity)
  }

  matches(productId: string, flavorId: string | null): boolean {
    return this.props.productId === productId && this.props.flavorId === flavorId
  }

  increaseQuantity(by: number): void {
    this.props.quantity += by
  }

  changeQuantity(quantity: number): void {
    this.props.quantity = quantity
  }
}

export interface CartProps {
  id: string
  customerId: string
  createdAt: Date
  updatedAt: Date
}

/** Cart aggregate root. Enforces "one line per (product, flavor)" invariant. */
export class Cart {
  private constructor(
    private props: CartProps,
    private _items: CartItem[],
  ) {}

  static create(input: { id: string; customerId: string; now?: Date }): Cart {
    const now = input.now ?? new Date()
    return new Cart(
      { id: input.id, customerId: input.customerId, createdAt: now, updatedAt: now },
      [],
    )
  }

  static restore(props: CartProps, items: CartItem[]): Cart {
    return new Cart(props, items)
  }

  get id(): string {
    return this.props.id
  }
  get customerId(): string {
    return this.props.customerId
  }
  get items(): readonly CartItem[] {
    return this._items
  }
  get isEmpty(): boolean {
    return this._items.length === 0
  }
  get total(): Money {
    return this._items.reduce((acc, item) => acc.add(item.subtotal), Money.zero())
  }

  addItem(input: {
    id: string
    productId: string
    flavorId: string | null
    quantity: number
    unitPrice: Money
  }): void {
    const existing = this._items.find((item) => item.matches(input.productId, input.flavorId))
    if (existing) {
      existing.increaseQuantity(input.quantity)
    } else {
      this._items.push(
        new CartItem({
          id: input.id,
          productId: input.productId,
          flavorId: input.flavorId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
        }),
      )
    }
    this.touch()
  }

  changeItemQuantity(itemId: string, quantity: number): Either<NotFoundError | ValidationError, void> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return left(new ValidationError('A quantidade deve ser um inteiro maior ou igual a 1.'))
    }
    const item = this._items.find((i) => i.id === itemId)
    if (!item) return left(new NotFoundError('Item não encontrado no carrinho.'))
    item.changeQuantity(quantity)
    this.touch()
    return right(undefined)
  }

  removeItem(itemId: string): Either<NotFoundError, void> {
    const before = this._items.length
    this._items = this._items.filter((i) => i.id !== itemId)
    if (this._items.length === before) {
      return left(new NotFoundError('Item não encontrado no carrinho.'))
    }
    this.touch()
    return right(undefined)
  }

  clear(): void {
    this._items = []
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
