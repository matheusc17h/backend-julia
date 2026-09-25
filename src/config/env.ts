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

const INSECURE_DEV_JWT_SECRET = 'dev-insecure-secret-change-me'

// Em produção, um JWT_SECRET ausente NUNCA deve cair silenciosamente num
// valor padrão: esse valor está no código-fonte (público no repositório),
// então qualquer pessoa poderia forjar um token válido — inclusive de
// admin. Em produção o processo se recusa a subir sem um segredo de
// verdade; em dev, mantém o fallback (com aviso) pra não travar quem só
// quer rodar localmente sem configurar nada.
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error(
    '[env] JWT_SECRET não definido em produção. Configure uma variável de ambiente ' +
      'JWT_SECRET com um valor longo e aleatório antes de subir o servidor.',
  )
}

if (!isProduction && !process.env.JWT_SECRET) {
  console.warn('[env] JWT_SECRET não definido — usando segredo inseguro de desenvolvimento.')
}

export const env = {
  port: optionalNumber(process.env.PORT, 3389),
  jwtSecret: process.env.JWT_SECRET ?? INSECURE_DEV_JWT_SECRET,
  passwordResetTtlMinutes: optionalNumber(process.env.PASSWORD_RESET_TTL_MINUTES, 15),
  tokenTtlSeconds: optionalNumber(process.env.TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  // E-mail de verdade (Brevo) é opcional: sem essas três variáveis, o
  // container cai de volta pro ConsoleMailProvider (só loga no terminal —
  // bom pra dev, inútil em produção).
  mail: {
    brevoApiKey: process.env.BREVO_API_KEY,
    fromEmail: process.env.MAIL_FROM_EMAIL,
    fromName: process.env.MAIL_FROM_NAME ?? 'Petit de L\'Amour',
  },
}
