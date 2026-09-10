import { Either, left, right } from '../../shared/either'
import { ValidationError } from '../../shared/errors'
import { Money } from '../../shared/money'

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface OrderItemProps {
  id: string
  productId: string
  flavorId: string | null
  productName: string
  flavorName: string | null
  quantity: number
  unitPrice: Money
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  static create(props: OrderItemProps): OrderItem {
    return new OrderItem(props)
  }

  get id(): string {
    return this.props.id
  }
  get productId(): string {
    return this.props.productId
  }
  get flavorId(): string | null {
    return this.props.flavorId
  }
  get productName(): string {
    return this.props.productName
  }
  get flavorName(): string | null {
    return this.props.flavorName
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

  toPublic() {
    return {
      id: this.id,
      productId: this.productId,
      flavorId: this.flavorId,
      productName: this.productName,
      flavorName: this.flavorName,
      quantity: this.quantity,
      unitPriceCents: this.unitPrice.cents,
      subtotalCents: this.subtotal.cents,
    }
  }
}

export interface OrderProps {
  id: string
  customerId: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

/** Order aggregate root. Built from an immutable snapshot of cart lines. */
export class Order {
  private constructor(
    private props: OrderProps,
    private _items: OrderItem[],
  ) {}

  static createFromItems(input: {
    id: string
    customerId: string
    items: OrderItemProps[]
    now?: Date
  }): Either<ValidationError, Order> {
    if (input.items.length === 0) {
      return left(new ValidationError('Não é possível criar um pedido sem itens.'))
    }
    const now = input.now ?? new Date()
    return right(
      new Order(
        {
          id: input.id,
          customerId: input.customerId,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
        input.items.map((i) => OrderItem.create(i)),
      ),
    )
  }

  static restore(props: OrderProps, items: OrderItem[]): Order {
    return new Order(props, items)
  }

  get id(): string {
    return this.props.id
  }
  get customerId(): string {
    return this.props.customerId
  }
  get status(): OrderStatus {
    return this.props.status
  }
  get items(): readonly OrderItem[] {
    return this._items
  }
  get total(): Money {
    return this._items.reduce((acc, item) => acc.add(item.subtotal), Money.zero())
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  markPaid(now = new Date()): Either<ValidationError, void> {
    if (this.props.status !== 'PENDING') {
      return left(new ValidationError('Apenas pedidos pendentes podem ser pagos.'))
    }
    this.props.status = 'PAID'
    this.props.updatedAt = now
    return right(undefined)
  }

  cancel(now = new Date()): Either<ValidationError, void> {
    if (this.props.status === 'PAID') {
      return left(new ValidationError('Pedidos já pagos não podem ser cancelados.'))
    }
    this.props.status = 'CANCELLED'
    this.props.updatedAt = now
    return right(undefined)
  }

  toPublic() {
    return {
      id: this.id,
      customerId: this.customerId,
      status: this.status,
      totalCents: this.total.cents,
      total: this.total.reais,
      items: this._items.map((i) => i.toPublic()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
