import { OrderRequest } from '../../domain/order-request/order-request'
import { OrderRequestRepository } from '../../domain/order-request/order-request.repository'
import { Either, left, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'

export interface CreateOrderRequestInput {
  customerName: string
  whatsapp: string
  productCategory: string
  deliveryDate?: string | null
  notes?: string | null
}

export interface CreateOrderRequestOutput {
  request: ReturnType<OrderRequest['toPublic']>
}

/** Recebe um pedido de contato do formulário público "/encomendas". */
export class CreateOrderRequest {
  constructor(
    private readonly requests: OrderRequestRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateOrderRequestInput): Promise<Either<AppError, CreateOrderRequestOutput>> {
    const deliveryDate = input.deliveryDate ? new Date(input.deliveryDate) : null

    const request = OrderRequest.create({
      id: this.ids.generate(),
      customerName: input.customerName,
      whatsapp: input.whatsapp,
      productCategory: input.productCategory,
      deliveryDate,
      notes: input.notes,
    })
    if (!request.ok) return left(request.value)

    await this.requests.create(request.value)

    return right({ request: request.value.toPublic() })
  }
}
