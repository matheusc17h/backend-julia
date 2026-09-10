/**
 * Application/domain errors. They carry an HTTP-friendly `status` and a stable
 * `code` so the HTTP layer can translate them without a giant switch statement.
 */
export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly status: number

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly status = 400
  constructor(message = 'Dados inválidos.', readonly details?: unknown) {
    super(message)
  }
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED'
  readonly status = 401
  constructor(message = 'Credenciais inválidas.') {
    super(message)
  }
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN'
  readonly status = 403
  constructor(message = 'Você não tem permissão para esta ação.') {
    super(message)
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly status = 404
  constructor(message = 'Recurso não encontrado.') {
    super(message)
  }
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT'
  readonly status = 409
  constructor(message = 'Conflito de estado.') {
    super(message)
  }
}
