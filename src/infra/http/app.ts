import cors, { FastifyCorsOptions } from '@fastify/cors'
import fastify, { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { env } from '../../config/env'
import { buildContainer } from '../../container'
import { AppError } from '../../shared/errors'
import { makeAuthGuards } from './auth'
import { zodToValidationError } from './http-helpers'
import { authRoutes } from './routes/auth-routes'
import { cartRoutes } from './routes/cart-routes'
import { customerRoutes } from './routes/customer-routes'
import { flavorRoutes } from './routes/flavor-routes'
import { orderRoutes } from './routes/order-routes'
import { productRoutes } from './routes/product-routes'

export function buildApp(): FastifyInstance {
  const app = fastify({ logger: true })
  const container = buildContainer()
  const guards = makeAuthGuards(container.tokens)

  // Libera o navegador a chamar a API a partir da(s) origem(ns) do frontend.
  app.register(cors, {
    origin: env.corsOrigins as FastifyCorsOptions['origin'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.get('/health', async () => ({ status: 'ok' }))

  // Each group is registered in its own encapsulated scope so route-level
  // preHandler hooks (auth) don't leak into sibling groups.
  app.register(async (instance) => customerRoutes(instance, container, guards))
  app.register(async (instance) => authRoutes(instance, container))
  app.register(async (instance) => productRoutes(instance, container, guards))
  app.register(async (instance) => flavorRoutes(instance, container, guards))
  app.register(async (instance) => cartRoutes(instance, container, guards))
  app.register(async (instance) => orderRoutes(instance, container, guards))

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.status).send({ error: error.code, message: error.message })
    }
    if (error instanceof ZodError) {
      const mapped = zodToValidationError(error)
      return reply
        .status(mapped.status)
        .send({ error: mapped.code, message: mapped.message, details: mapped.details })
    }
    if ((error as { validation?: unknown }).validation) {
      return reply
        .status(400)
        .send({ error: 'VALIDATION_ERROR', message: (error as Error).message })
    }

    app.log.error(error)
    return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' })
  })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'NOT_FOUND',
      message: `Rota ${request.method} ${request.url} não encontrada.`,
    })
  })

  return app
}
