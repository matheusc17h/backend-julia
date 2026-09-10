import { FlavorRepository } from '../../domain/catalog/catalog.repository'
import { Flavor } from '../../domain/catalog/flavor'
import { Either, left, right } from '../../shared/either'
import { AppError, ConflictError, NotFoundError, ValidationError } from '../../shared/errors'

export interface UpdateFlavorInput {
  id: string
  name?: string
  active?: boolean
}

export interface UpdateFlavorOutput {
  flavor: ReturnType<Flavor['toPublic']>
}

/** Edição de sabores pelo administrador. */
export class UpdateFlavor {
  constructor(private readonly flavors: FlavorRepository) {}

  async execute(input: UpdateFlavorInput): Promise<Either<AppError, UpdateFlavorOutput>> {
    const flavor = await this.flavors.findById(input.id)
    if (!flavor) return left(new NotFoundError('Sabor não encontrado.'))

    if (input.name !== undefined) {
      const name = input.name.trim()
      if (name.length < 2) return left(new ValidationError('Informe um nome de sabor válido.'))
      const clash = await this.flavors.findByName(name)
      if (clash && clash.id !== flavor.id) {
        return left(new ConflictError('Já existe um sabor com este nome.'))
      }
    }

    flavor.update({ name: input.name, active: input.active })
    await this.flavors.save(flavor)

    return right({ flavor: flavor.toPublic() })
  }
}
