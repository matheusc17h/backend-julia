export interface FlavorProps {
  id: string
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

/** Flavor aggregate root (e.g. "Chocolate", "Morango"). */
export class Flavor {
  private constructor(private props: FlavorProps) {}

  static create(input: {
    id: string
    name: string
    active?: boolean
    now?: Date
  }): Flavor {
    const now = input.now ?? new Date()
    return new Flavor({
      id: input.id,
      name: input.name.trim(),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: FlavorProps): Flavor {
    return new Flavor(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get active(): boolean {
    return this.props.active
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  update(data: { name?: string; active?: boolean }, now = new Date()): void {
    if (data.name !== undefined) this.props.name = data.name.trim()
    if (data.active !== undefined) this.props.active = data.active
    this.props.updatedAt = now
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
