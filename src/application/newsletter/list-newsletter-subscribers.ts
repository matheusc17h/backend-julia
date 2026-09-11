import { Paginated } from '../../domain/catalog/catalog.repository'
import { NewsletterSubscriber } from '../../domain/newsletter/newsletter-subscriber'
import { NewsletterSubscriberRepository } from '../../domain/newsletter/newsletter-subscriber.repository'
import { Either, right } from '../../shared/either'
import { AppError } from '../../shared/errors'
import { clampPagination } from '../shared/pagination'

export interface ListNewsletterSubscribersInput {
  page?: number
  perPage?: number
}

export type ListNewsletterSubscribersOutput = Paginated<ReturnType<NewsletterSubscriber['toPublic']>>

/** Lista os e-mails captados pro remarketing. Uso do admin. */
export class ListNewsletterSubscribers {
  constructor(private readonly subscribers: NewsletterSubscriberRepository) {}

  async execute(
    input: ListNewsletterSubscribersInput,
  ): Promise<Either<AppError, ListNewsletterSubscribersOutput>> {
    const { page, perPage } = clampPagination(input.page, input.perPage)
    const result = await this.subscribers.list({ page, perPage })
    return right({ ...result, items: result.items.map((s) => s.toPublic()) })
  }
}
