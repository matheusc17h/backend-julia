import { FlavorRepository } from '../../domain/catalog/catalog.repository'
import { Flavor } from '../../domain/catalog/flavor'
import { Either, left, right } from '../../shared/either'
import { AppError, ConflictError, ValidationError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'

export interface CreateFlavorInput {
  name: string
  active?: boolean
}

export interface CreateFlavorOutput {
  flavor: ReturnType<Flavor['toPublic']>
}

/** Cadastro de novos sabores pelo administrador. */
export class CreateFlavor {
  constructor(
    private readonly flavors: FlavorRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateFlavorInput): Promise<Either<AppError, CreateFlavorOutput>> {
    const name = input.name?.trim() ?? ''
    if (name.length < 2) {
      return left(new ValidationError('Informe um nome de sabor válido.'))
    }

    const existing = await this.flavors.findByName(name)
    if (existing) return left(new ConflictError('Já existe um sabor com este nome.'))

    const flavor = Flavor.create({
      id: this.ids.generate(),
      name,
      active: input.active,
    })

    await this.flavors.create(flavor)

    return right({ flavor: flavor.toPublic() })
  }
}
