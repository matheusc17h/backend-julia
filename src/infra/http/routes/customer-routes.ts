import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
  phone: z.string().trim().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export function customerRoutes(
  app: FastifyInstance,
  container: Container,
  guards: AuthGuards,
): void {
  // Cadastro de clientes. Limite pra não virar fábrica automática de contas.
  app.post(
    '/customers',
    { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const parsed = parseWith(registerSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.registerCustomer.execute(parsed.value)
      return sendResult(reply, result, 201)
    },
  )

  // Login. Limite pra dificultar força bruta de senha.
  app.post(
    '/sessions',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = parseWith(loginSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.authenticateCustomer.execute(parsed.value)
      return sendResult(reply, result, 200)
    },
  )

  // Perfil do cliente autenticado
  app.get('/me', { preHandler: [guards.authenticate] }, async (request, reply) => {
    const result = await container.useCases.getCustomerProfile.execute({
      customerId: request.user!.id,
    })
    return sendResult(reply, result)
  })
}
