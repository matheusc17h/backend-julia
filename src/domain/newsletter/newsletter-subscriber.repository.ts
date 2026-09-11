import { Paginated, Pagination } from '../catalog/catalog.repository'
import { NewsletterSubscriber } from './newsletter-subscriber'

export interface NewsletterSubscriberRepository {
  findByEmail(email: string): Promise<NewsletterSubscriber | null>
  create(subscriber: NewsletterSubscriber): Promise<void>
  list(pagination: Pagination): Promise<Paginated<NewsletterSubscriber>>
}
