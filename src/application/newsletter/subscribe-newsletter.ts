import { NewsletterSubscriber } from '../../domain/newsletter/newsletter-subscriber'
import { NewsletterSubscriberRepository } from '../../domain/newsletter/newsletter-subscriber.repository'
import { Either, left, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { IdGenerator } from '../ports/generators'

export interface SubscribeNewsletterInput {
  email: string
}

export interface SubscribeNewsletterOutput {
  subscribed: boolean
}

/**
 * Inscreve um e-mail na lista de remarketing (formulário do rodapé).
 * Idempotente: se o e-mail já estiver inscrito, responde sucesso sem
 * duplicar nem revelar isso como erro — evita dar munição pra alguém
 * descobrir por tentativa quais e-mails já estão na lista.
 */
export class SubscribeNewsletter {
  constructor(
    private readonly subscribers: NewsletterSubscriberRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: SubscribeNewsletterInput): Promise<Either<AppError, SubscribeNewsletterOutput>> {
    const subscriber = NewsletterSubscriber.create({ id: this.ids.generate(), email: input.email })
    if (!subscriber.ok) return left(subscriber.value)

    const existing = await this.subscribers.findByEmail(subscriber.value.email.value)
    if (!existing) {
      await this.subscribers.create(subscriber.value)
    }

    return right({ subscribed: true })
  }
}
