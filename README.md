# backend-julia

API de e-commerce (sorveteria) construída com **Fastify + Prisma (SQLite)** seguindo
**DDD**, **SOLID** e **Clean Architecture**.

## Funcionalidades

| Recurso | Endpoint |
| --- | --- |
| Cadastro de clientes | `POST /customers` |
| Login | `POST /sessions` |
| Recuperação de senha (envia código por e-mail) | `POST /password/forgot` |
| Redefinição de senha com o código | `POST /password/reset` |
| Catálogo de produtos (público) | `GET /products`, `GET /products/:id` |
| Cadastro de produto (admin) | `POST /admin/products` |
| Edição de produto (admin) | `PUT /admin/products/:id` |
| Listagem de produtos incl. inativos (admin) | `GET /admin/products` |
| Sabores (público) | `GET /flavors` |
| Cadastro de sabor (admin) | `POST /admin/flavors` |
| Edição de sabor (admin) | `PUT /admin/flavors/:id` |
| Carrinho de compras | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart` |
| Criação de pedido (a partir do carrinho) | `POST /orders` |
| Pedidos do cliente | `GET /orders`, `GET /orders/:id` |

Autenticação via `Authorization: Bearer <token>`. Um **admin** é um `Customer` com
`role = "ADMIN"`.

## Camadas (Clean Architecture)

```
src/
  domain/          Entidades, agregados, value objects e interfaces de repositório.
                   Sem dependência de framework, Prisma ou HTTP.
    customer/      Customer, Email, política de senha
    auth/          PasswordResetCode
    catalog/       Product, Flavor
    cart/          Cart, CartItem (agregado)
    order/         Order, OrderItem (agregado)
  application/     Casos de uso (regras de aplicação) + "ports" (interfaces de
                   infraestrutura: HashProvider, TokenProvider, MailProvider, ...).
                   Retornam `Either<AppError, T>` em vez de lançar exceções.
  infra/           Implementações concretas (adapters):
    database/prisma/  Repositórios Prisma + mapeadores linha <-> entidade
    providers/        scrypt (hash), HMAC (token), console (e-mail), uuid/código
    http/             Fastify: rotas, guards de auth, tratamento de erro
  container.ts     Composition root — único lugar que conhece implementações concretas.
  server.ts        Entrypoint.
```

Regras SOLID aplicadas: casos de uso dependem só de abstrações (DIP); cada porta é
pequena e coesa (ISP); entidades protegem invariantes e não são "anêmicas".
Trocar SQLite, o provedor de e-mail ou o formato de token não afeta domínio nem
casos de uso.

## Como rodar

```bash
npm install
npm run db:migrate      # aplica as migrations
npm run db:seed         # cria o admin (admin@julia.dev / admin12345)
npm run dev             # sobe a API em http://localhost:3389
```

Variáveis de ambiente (`.env`): `DATABASE_URL`, `PORT`, `JWT_SECRET`,
`TOKEN_TTL_SECONDS`, `PASSWORD_RESET_TTL_MINUTES`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

O `ConsoleMailProvider` **imprime o e-mail no terminal** (inclusive o código de
recuperação). Em produção, implemente `MailProvider` com SMTP/SES/etc.

## Scripts

| Script | Ação |
| --- | --- |
| `npm run dev` | API com hot reload |
| `npm start` | API sem watch |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | cria o admin |
| `npm run db:studio` | Prisma Studio |

## Valores monetários

Preços trafegam e são persistidos em **centavos** (`priceCents`, `totalCents`,
`unitPriceCents`). O value object `Money` centraliza soma/multiplicação.
