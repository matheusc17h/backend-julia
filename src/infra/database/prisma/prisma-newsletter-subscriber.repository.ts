import { Paginated, Pagination } from '../../../domain/catalog/catalog.repository'
import { Email } from '../../../domain/customer/email'
import { NewsletterSubscriber } from '../../../domain/newsletter/newsletter-subscriber'
import { NewsletterSubscriberRepository } from '../../../domain/newsletter/newsletter-subscriber.repository'
import { PrismaClientInstance } from './client'

type Row = { id: string; email: string; createdAt: Date }

function toDomain(row: Row): NewsletterSubscriber {
  return NewsletterSubscriber.restore({
    id: row.id,
    email: Email.unsafe(row.email),
    createdAt: row.createdAt,
  })
}

export class PrismaNewsletterSubscriberRepository implements NewsletterSubscriberRepository {
  constructor(private readonly prisma: PrismaClientInstance) {}

  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    const row = await this.prisma.newsletterSubscriber.findUnique({ where: { email } })
    return row ? toDomain(row) : null
  }

  async create(subscriber: NewsletterSubscriber): Promise<void> {
    const p = subscriber.toPublic()
    await this.prisma.newsletterSubscriber.create({
      data: { id: p.id, email: p.email, createdAt: p.createdAt },
    })
  }

  async list(pagination: Pagination): Promise<Paginated<NewsletterSubscriber>> {
    const [rows, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.newsletterSubscriber.count(),
    ])
    return {
      items: rows.map(toDomain),
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    }
  }
}
