import { FastifyReply } from 'fastify'
import { z, ZodError, ZodTypeAny } from 'zod'
import { Either } from '../../shared/either'
import { AppError, ValidationError } from '../../shared/errors'

/** Parse + validate a payload with Zod, converting failures into ValidationError. */
export function parseWith<S extends ZodTypeAny>(
  schema: S,
  data: unknown,
): Either<ValidationError, z.infer<S>> {
  const result = schema.safeParse(data)
  if (result.success) return { ok: true, value: result.data }
  return { ok: false, value: zodToValidationError(result.error) }
}

export function zodToValidationError(error: ZodError): ValidationError {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
  return new ValidationError('Dados inválidos.', details)
}

/** Send the result of a use case: success payload or mapped AppError. */
export function sendResult<T>(
  reply: FastifyReply,
  result: Either<AppError, T>,
  successStatus = 200,
): FastifyReply {
  if (result.ok) {
    return reply.status(successStatus).send(result.value)
  }
  return reply.status(result.value.status).send({
    error: result.value.code,
    message: result.value.message,
    ...(result.value instanceof ValidationError && result.value.details
      ? { details: result.value.details }
      : {}),
  })
}
