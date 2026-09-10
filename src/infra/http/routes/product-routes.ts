import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().trim().min(1).optional(),
  priceCents: z.number().int().nonnegative(),
  active: z.boolean().optional(),
  category: z.string().trim().min(1).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  flavorIds: z.array(z.string().uuid()).optional(),
})

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    priceCents: z.number().int().nonnegative().optional(),
    active: z.boolean().optional(),
    category: z.string().trim().min(1).nullable().optional(),
    imageUrl: z.string().trim().min(1).nullable().optional(),
    flavorIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nenhum campo para atualizar.' })

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

export function productRoutes(
  app: FastifyInstance,
  container: Container,
  guards: AuthGuards,
): void {
  // Catálogo público (somente produtos ativos)
  app.get('/products', async (request, reply) => {
    const parsed = parseWith(listQuerySchema, request.query)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.listProducts.execute({
      page: parsed.value.page,
      perPage: parsed.value.perPage,
      search: parsed.value.search,
      category: parsed.value.category,
      includeInactive: false,
    })
    return sendResult(reply, result)
  })

  app.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await container.useCases.getProduct.execute({ id })
    return sendResult(reply, result)
  })

  // Administração
  app.get(
    '/admin/products',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(listQuerySchema, request.query)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.listProducts.execute({
        page: parsed.value.page,
        perPage: parsed.value.perPage,
        search: parsed.value.search,
        category: parsed.value.category,
        includeInactive: parsed.value.includeInactive ?? true,
      })
      return sendResult(reply, result)
    },
  )

  // Cadastro de novos produtos pelo administrador
  app.post(
    '/admin/products',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const parsed = parseWith(createSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.createProduct.execute(parsed.value)
      return sendResult(reply, result, 201)
    },
  )

  // Edição de produtos pelo administrador
  app.put(
    '/admin/products/:id',
    { preHandler: [guards.authenticate, guards.authorizeAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = parseWith(updateSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.updateProduct.execute({ id, ...parsed.value })
      return sendResult(reply, result)
    },
  )
}
