import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { AuthGuards } from '../auth'
import { parseWith, sendResult } from '../http-helpers'

const addItemSchema = z.object({
  productId: z.string().uuid(),
  flavorId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
})

const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
})

export function cartRoutes(app: FastifyInstance, container: Container, guards: AuthGuards): void {
  app.addHook('preHandler', guards.authenticate)

  // Consultar carrinho
  app.get('/cart', async (request, reply) => {
    const result = await container.useCases.getCart.execute({ customerId: request.user!.id })
    return sendResult(reply, result)
  })

  // Adicionar item
  app.post('/cart/items', async (request, reply) => {
    const parsed = parseWith(addItemSchema, request.body)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.addCartItem.execute({
      customerId: request.user!.id,
      productId: parsed.value.productId,
      flavorId: parsed.value.flavorId ?? null,
      quantity: parsed.value.quantity,
    })
    return sendResult(reply, result, 201)
  })

  // Alterar quantidade de um item
  app.patch('/cart/items/:itemId', async (request, reply) => {
    const { itemId } = request.params as { itemId: string }
    const parsed = parseWith(updateItemSchema, request.body)
    if (!parsed.ok) return sendResult(reply, parsed)

    const result = await container.useCases.updateCartItem.execute({
      customerId: request.user!.id,
      itemId,
      quantity: parsed.value.quantity,
    })
    return sendResult(reply, result)
  })

  // Remover item
  app.delete('/cart/items/:itemId', async (request, reply) => {
    const { itemId } = request.params as { itemId: string }
    const result = await container.useCases.removeCartItem.execute({
      customerId: request.user!.id,
      itemId,
    })
    return sendResult(reply, result)
  })

  // Esvaziar carrinho
  app.delete('/cart', async (request, reply) => {
    const result = await container.useCases.clearCart.execute({ customerId: request.user!.id })
    return sendResult(reply, result)
  })
}
