import { Money } from '../../shared/money'

export interface ProductProps {
  id: string
  name: string
  description: string | null
  price: Money
  active: boolean
  /** Loose grouping shown in the storefront (e.g. "cones", "bolos", "ovos"). */
  category: string | null
  /** Reference to the product image (a file name or URL). */
  imageUrl: string | null
  /** Flavors this product can be ordered with. Empty = no flavor choice. */
  flavorIds: string[]
  createdAt: Date
  updatedAt: Date
}

/** Product aggregate root. */
export class Product {
  private constructor(private props: ProductProps) {}

  static create(input: {
    id: string
    name: string
    price: Money
    description?: string | null
    active?: boolean
    category?: string | null
    imageUrl?: string | null
    flavorIds?: string[]
    now?: Date
  }): Product {
    const now = input.now ?? new Date()
    return new Product({
      id: input.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      active: input.active ?? true,
      category: input.category?.trim().toLowerCase() || null,
      imageUrl: input.imageUrl?.trim() || null,
      flavorIds: [...new Set(input.flavorIds ?? [])],
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: ProductProps): Product {
    return new Product(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get description(): string | null {
    return this.props.description
  }
  get price(): Money {
    return this.props.price
  }
  get active(): boolean {
    return this.props.active
  }
  get category(): string | null {
    return this.props.category
  }
  get imageUrl(): string | null {
    return this.props.imageUrl
  }
  get flavorIds(): readonly string[] {
    return this.props.flavorIds
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  offersFlavor(flavorId: string): boolean {
    return this.props.flavorIds.includes(flavorId)
  }

  get requiresFlavor(): boolean {
    return this.props.flavorIds.length > 0
  }

  update(
    data: {
      name?: string
      description?: string | null
      price?: Money
      active?: boolean
      category?: string | null
      imageUrl?: string | null
      flavorIds?: string[]
    },
    now = new Date(),
  ): void {
    if (data.name !== undefined) this.props.name = data.name.trim()
    if (data.description !== undefined) this.props.description = data.description?.trim() || null
    if (data.price !== undefined) this.props.price = data.price
    if (data.active !== undefined) this.props.active = data.active
    if (data.category !== undefined) this.props.category = data.category?.trim().toLowerCase() || null
    if (data.imageUrl !== undefined) this.props.imageUrl = data.imageUrl?.trim() || null
    if (data.flavorIds !== undefined) this.props.flavorIds = [...new Set(data.flavorIds)]
    this.props.updatedAt = now
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      priceCents: this.price.cents,
      price: this.price.reais,
      active: this.active,
      category: this.category,
      imageUrl: this.imageUrl,
      flavorIds: [...this.props.flavorIds],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
