import { Either, left, right } from '../../shared/either'
import { ValidationError } from '../../shared/errors'

export type OrderRequestStatus = 'PENDING' | 'CONTACTED' | 'DONE'

export interface OrderRequestProps {
  id: string
  customerName: string
  whatsapp: string
  productCategory: string
  deliveryDate: Date | null
  notes: string | null
  status: OrderRequestStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * Pedido de contato vindo do formulário público "/encomendas" — não exige
 * conta. A equipe entra em contato pelo WhatsApp pra confirmar detalhes e
 * combinar o pagamento; não é o mesmo agregado que `Order` (que já nasce a
 * partir de um carrinho de cliente autenticado).
 */
export class OrderRequest {
  private constructor(private props: OrderRequestProps) {}

  static create(input: {
    id: string
    customerName: string
    whatsapp: string
    productCategory: string
    deliveryDate?: Date | null
    notes?: string | null
    now?: Date
  }): Either<ValidationError, OrderRequest> {
    const name = input.customerName?.trim() ?? ''
    if (name.length < 2) {
      return left(new ValidationError('Informe um nome válido.'))
    }

    const whatsappDigits = (input.whatsapp ?? '').replace(/\D/g, '')
    if (whatsappDigits.length < 10 || whatsappDigits.length > 13) {
      return left(new ValidationError('Informe um WhatsApp válido, com DDD.'))
    }

    const category = input.productCategory?.trim() ?? ''
    if (category.length < 2) {
      return left(new ValidationError('Selecione o produto desejado.'))
    }

    if (input.deliveryDate && Number.isNaN(input.deliveryDate.getTime())) {
      return left(new ValidationError('Data de entrega inválida.'))
    }

    const now = input.now ?? new Date()
    return right(
      new OrderRequest({
        id: input.id,
        customerName: name,
        whatsapp: whatsappDigits,
        productCategory: category,
        deliveryDate: input.deliveryDate ?? null,
        notes: input.notes?.trim() || null,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static restore(props: OrderRequestProps): OrderRequest {
    return new OrderRequest(props)
  }

  get id(): string {
    return this.props.id
  }
  get status(): OrderRequestStatus {
    return this.props.status
  }

  toPublic() {
    return {
      id: this.props.id,
      customerName: this.props.customerName,
      whatsapp: this.props.whatsapp,
      productCategory: this.props.productCategory,
      deliveryDate: this.props.deliveryDate,
      notes: this.props.notes,
      status: this.props.status,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }
}
