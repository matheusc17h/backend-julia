import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const createSchema = z.object({
  name: z.string().min(2),
  active: z.boolean().optional(),
})

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nenhum campo para atualizar.' })

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

export function flavorRoutes(app: FastifyInstance, container: Container, guards: AuthGuards): void {
  app.get('/flavors', async (request, reply) => {
    const parsed = parseWith(listQuerySchema, request.query)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.listFlavors.execute({
      page: parsed.value.page,
      perPage: parsed.value.perPage,
      includeInactive: false,
    })
    return sendResult(reply, result)
  })

  app.get(
    '/admin/flavors',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(listQuerySchema, request.query)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.listFlavors.execute({
        page: parsed.value.page,
        perPage: parsed.value.perPage,
        includeInactive: parsed.value.includeInactive ?? true,
      })
      return sendResult(reply, result)
    },
  )

  // Cadastro de novos sabores pelo administrador
  app.post(
    '/admin/flavors',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(createSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.createFlavor.execute(parsed.value)
      return sendResult(reply, result, 201)
    },
  )

  // Edição de sabores pelo administrador
  app.put(
    '/admin/flavors/:id',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = parseWith(updateSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.updateFlavor.execute({ id, ...parsed.value })
      return sendResult(reply, result)
    },
  )
}
