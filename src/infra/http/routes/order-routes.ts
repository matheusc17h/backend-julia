import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
})

export function orderRoutes(app: FastifyInstance, container: Container, guards: AuthGuards): void {
  app.addHook('preHandler', guards.authenticate)

  // Criação de pedidos (a partir do carrinho do cliente autenticado)
  app.post('/orders', async (request, reply) => {
    const result = await container.useCases.createOrder.execute({ customerId: request.user!.id })
    return sendResult(reply, result, 201)
  })

  // Lista de pedidos do cliente autenticado
  app.get('/orders', async (request, reply) => {
    const parsed = parseWith(listQuerySchema, request.query)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.listOrders.execute({
      customerId: request.user!.id,
      page: parsed.value.page,
      perPage: parsed.value.perPage,
    })
    return sendResult(reply, result)
  })

  // Detalhe de um pedido (dono ou admin)
  app.get('/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await container.useCases.getOrder.execute({
      orderId: id,
      requesterId: request.user!.id,
      requesterIsAdmin: request.user!.role === 'ADMIN',
    })
    return sendResult(reply, result)
  })

  // ---------- Administração ----------

  // Números gerais pro painel: total de pedidos, faturamento, clientes únicos
  app.get(
    '/admin/orders/summary',
    { preHandler: [guards.authorizeAdmin] },
    async (_request, reply) => {
      const result = await container.useCases.getAdminDashboardSummary.execute()
      return sendResult(reply, result)
    },
  )

  // Lista todos os pedidos, de todos os clientes, com nome/e-mail/telefone
  app.get('/admin/orders', { preHandler: [guards.authorizeAdmin] }, async (request, reply) => {
    const parsed = parseWith(listQuerySchema, request.query)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.listAllOrders.execute({
      page: parsed.value.page,
      perPage: parsed.value.perPage,
    })
    return sendResult(reply, result)
  })

  // Detalhe de um pedido qualquer, com dados do cliente
  app.get(
    '/admin/orders/:id',
    { preHandler: [guards.authorizeAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await container.useCases.getAdminOrder.execute({ orderId: id })
      return sendResult(reply, result)
    },
  )
}
