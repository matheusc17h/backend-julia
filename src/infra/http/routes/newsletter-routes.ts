import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const subscribeSchema = z.object({
  email: z.string().email('E-mail inválido.'),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
})

export function newsletterRoutes(
  app: FastifyInstance,
  container: Container,
  guards: AuthGuards,
): void {
  // Formulário público "Receba Ofertas Especiais" (rodapé) — não exige
  // login. Limite pra não virar spam de inscrições.
  app.post(
    '/newsletter/subscribers',
    { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const parsed = parseWith(subscribeSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.subscribeNewsletter.execute(parsed.value)
      return sendResult(reply, result, 201)
    },
  )

  // Lista os e-mails captados. Uso do admin (pra disparar promoções depois).
  app.get(
    '/admin/newsletter/subscribers',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(listQuerySchema, request.query)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.listNewsletterSubscribers.execute(parsed.value)
      return sendResult(reply, result)
    },
  )
}
