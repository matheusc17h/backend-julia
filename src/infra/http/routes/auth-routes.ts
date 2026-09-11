import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../../container'
import { parseWith, sendResult } from '../http-helpers'

const requestResetSchema = z.object({
  email: z.string().email('E-mail inválido.'),
})

const resetSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  code: z.string().min(4, 'Código inválido.'),
  newPassword: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
})

export function authRoutes(app: FastifyInstance, container: Container): void {
  // Recuperação de senha: solicita o código de recuperação por e-mail.
  // Limite apertado pra não virar spam de e-mail nem varredura de contas.
  app.post(
    '/password/forgot',
    { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const parsed = parseWith(requestResetSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.requestPasswordReset.execute(parsed.value)
      return sendResult(reply, result, 202)
    },
  )

  // Recuperação de senha: valida o código e define a nova senha.
  // Limite apertado: o código tem só 6 dígitos (1 milhão de combinações),
  // sem isso daria pra forçar bruto dentro da janela de validade dele.
  app.post(
    '/password/reset',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = parseWith(resetSchema, request.body)
      if (!parsed.ok) return sendResult(reply, parsed)

      const result = await container.useCases.resetPassword.execute(parsed.value)
      return sendResult(reply, result, 200)
    },
  )
}
