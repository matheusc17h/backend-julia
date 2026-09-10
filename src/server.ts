import { env } from './config/env'
import { buildApp } from './infra/http/app'

const app = buildApp()

app
  .listen({ port: env.port, host: '0.0.0.0' })
  .then((address) => {
    app.log.info(`HTTP server running at ${address}`)
  })
  .catch((error) => {
    app.log.error(error)
    process.exit(1)
  })
