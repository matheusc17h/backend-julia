import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../../generated/client/client'

if (!process.env.DATABASE_URL) {
  throw new Error('[db] DATABASE_URL não definida — configure a connection string do Postgres no .env.')
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })

export type PrismaClientInstance = typeof prisma
