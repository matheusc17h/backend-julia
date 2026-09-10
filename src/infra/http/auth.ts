import { FastifyReply, FastifyRequest } from 'fastify'
import { TokenProvider } from '../../application/ports/token-provider'

export interface AuthenticatedUser {
  id: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

/**
 * Builds Fastify preHandlers for authentication / admin authorization.
 * Kept as a factory so the `TokenProvider` is injected (no import-time singletons).
 */
export function makeAuthGuards(tokens: TokenProvider) {
  async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      await reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Token não informado.' })
      return
    }

    const payload = tokens.verify(header.slice(7).trim())
    if (!payload) {
      await reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' })
      return
    }

    request.user = { id: payload.sub, role: payload.role }
  }

  async function authorizeAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      await reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Token não informado.' })
      return
    }
    if (request.user.role !== 'ADMIN') {
      await reply
        .status(403)
        .send({ error: 'FORBIDDEN', message: 'Ação permitida apenas para administradores.' })
      return
    }
  }

  return { authenticate, authorizeAdmin }
}

export type AuthGuards = ReturnType<typeof makeAuthGuards>
