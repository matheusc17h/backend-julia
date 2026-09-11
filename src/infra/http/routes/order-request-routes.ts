import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const createSchema = z.object({
  customerName: z.string().min(2, 'Informe um nome válido.'),
  whatsapp: z.string().min(8, 'Informe um WhatsApp válido.'),
  productCategory: z.string().min(2, 'Selecione o produto desejado.'),
  deliveryDate: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
})

export function orderRequestRoutes(
  app: FastifyInstance,
  container: Container,
  guards: AuthGuards,
): void {
  // Formulário público "Faça sua Encomenda" — não exige login. Limite
  // apertado pra não virar spam.
  app.post(
    '/order-requests',
    { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const parsed = parseWith(createSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.createOrderRequest.execute(parsed.value)
      return sendResult(reply, result, 201)
    },
  )

  // Lista os pedidos de contato recebidos. Uso do admin.
  app.get(
    '/admin/order-requests',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(listQuerySchema, request.query)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.listOrderRequests.execute(parsed.value)
      return sendResult(reply, result)
    },
  )
}
