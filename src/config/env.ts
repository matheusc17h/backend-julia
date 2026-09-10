import 'dotenv/config'

function optionalNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Origem permitida para CORS. Aceita, em CORS_ORIGINS:
 *  - "*"           -> libera qualquer origem
 *  - "localhost"   -> libera qualquer porta de localhost / 127.0.0.1 (padrão em dev)
 *  - lista de URLs separadas por vírgula -> libera exatamente essas
 */
type CorsOrigin = boolean | string[] | ((origin: string, cb: (err: Error | null, allow: boolean) => void) => void)

function parseOrigins(value: string | undefined): CorsOrigin {
  const raw = (value ?? 'localhost').trim()
  if (raw === '*') return true
  if (raw === 'localhost') {
    return (origin, cb) => {
      if (!origin) return cb(null, true) // curl / mesma origem
      const ok = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      cb(null, ok)
    }
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export const env = {
  port: optionalNumber(process.env.PORT, 3389),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  passwordResetTtlMinutes: optionalNumber(process.env.PASSWORD_RESET_TTL_MINUTES, 15),
  tokenTtlSeconds: optionalNumber(process.env.TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
}

if (env.jwtSecret === 'dev-insecure-secret-change-me') {
  console.warn('[env] JWT_SECRET não definido — usando segredo inseguro de desenvolvimento.')
}
