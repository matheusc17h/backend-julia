import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { prisma } from '../src/infra/database/prisma/client'
import { CryptoHashProvider } from '../src/infra/providers/crypto-hash-provider'

/**
 * Seeds an administrator account and the initial storefront catalog.
 * Idempotent: skips whatever already exists.
 * Override the admin with ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@julia.dev').toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345'

  const existing = await prisma.customer.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin já existe: ${email}`)
    return
  }

  const hasher = new CryptoHashProvider()
  await prisma.customer.create({
    data: {
      id: randomUUID(),
      name: 'Administrador',
      email,
      passwordHash: await hasher.hash(password),
      role: 'ADMIN',
    },
  })
  console.log(`Admin criado: ${email} / senha: ${password}`)
}

type SeedProduct = {
  name: string
  priceCents: number
  category: 'cones' | 'bolos' | 'ovos'
  imageUrl: string
  description?: string
}

const CATALOG: SeedProduct[] = [
  // Cones trufados — R$ 15,00
  { name: 'Cone Trufado Kinder Bueno', priceCents: 1500, category: 'cones', imageUrl: 'cone-kinder.png' },
  { name: 'Cone Trufado Ovomaltine', priceCents: 1500, category: 'cones', imageUrl: 'cone-ovomaltine.png' },
  { name: 'Cone Trufado Ouro Branco', priceCents: 1500, category: 'cones', imageUrl: 'cone-ourob.png' },
  { name: 'Cone Trufado Ferrero Rocher', priceCents: 1500, category: 'cones', imageUrl: 'cone-ferrero1.png' },
  { name: 'Cone Trufado Cookies & Cream', priceCents: 1500, category: 'cones', imageUrl: 'cone-cookies-cream.jpg' },
  { name: 'Cone Trufado Prestígio', priceCents: 1500, category: 'cones', imageUrl: 'cone-prestigio.jpg' },
  { name: 'Cone Trufado Maracujá', priceCents: 1500, category: 'cones', imageUrl: 'cone-maracuja.jpg' },
  { name: 'Cone Trufado Morango', priceCents: 1500, category: 'cones', imageUrl: 'cone-morango.jpg' },
  // Bolos artesanais
  { name: 'Bolo Brigadeiro Gourmet', priceCents: 12000, category: 'bolos', imageUrl: 'bolo1.png' },
  { name: 'Bolo Morango com Leite Ninho', priceCents: 13000, category: 'bolos', imageUrl: 'bolo2.png' },
  { name: 'Bolo de Chocolate', priceCents: 11000, category: 'bolos', imageUrl: 'bolo3.png' },
  { name: 'Bolo de Baunilha', priceCents: 11000, category: 'bolos', imageUrl: 'bolo-baunilha.jpg' },
  // Ovos de páscoa trufados
  { name: 'Ovo Trufado Brigadeiro Gourmet', priceCents: 4500, category: 'ovos', imageUrl: 'ovo-brigadeiro.jpg' },
  { name: 'Ovo Trufado Prestígio', priceCents: 4500, category: 'ovos', imageUrl: 'ovo-prestigio.jpg' },
  { name: 'Ovo Trufado Ninho com Morango', priceCents: 5000, category: 'ovos', imageUrl: 'ovo-ninho-morango.jpg' },
  { name: 'Ovo Trufado Kinder Bueno', priceCents: 5500, category: 'ovos', imageUrl: 'ovo-kinder.jpg' },
]

async function seedCatalog() {
  const count = await prisma.product.count()
  if (count > 0) {
    console.log(`Catálogo já tem ${count} produto(s) — pulando seed do cardápio.`)
    return
  }

  const now = new Date()
  await prisma.product.createMany({
    data: CATALOG.map((p) => ({
      id: randomUUID(),
      name: p.name,
      description: p.description ?? null,
      priceCents: p.priceCents,
      active: true,
      category: p.category,
      imageUrl: p.imageUrl,
      createdAt: now,
      updatedAt: now,
    })),
  })
  console.log(`Cardápio criado: ${CATALOG.length} produtos.`)
}

async function main() {
  await seedAdmin()
  await seedCatalog()
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
