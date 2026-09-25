import { env } from './config/env'

import { RequestPasswordReset } from './application/auth/request-password-reset'
import { ResetPassword } from './application/auth/reset-password'
import { AddCartItem } from './application/cart/add-cart-item'
import { ClearCart } from './application/cart/clear-cart'
import { GetCart } from './application/cart/get-cart'
import { RemoveCartItem } from './application/cart/remove-cart-item'
import { UpdateCartItem } from './application/cart/update-cart-item'
import { AuthenticateCustomer } from './application/customer/authenticate-customer'
import { GetCustomerProfile } from './application/customer/get-customer-profile'
import { RegisterCustomer } from './application/customer/register-customer'
import { CreateFlavor } from './application/flavor/create-flavor'
import { ListFlavors } from './application/flavor/list-flavors'
import { UpdateFlavor } from './application/flavor/update-flavor'
import { ConfirmOrder } from './application/order/confirm-order'
import { CreateOrder } from './application/order/create-order'
import { DenyOrder } from './application/order/deny-order'
import { GetAdminDashboardSummary } from './application/order/get-admin-dashboard-summary'
import { GetAdminOrder } from './application/order/get-admin-order'
import { GetOrder } from './application/order/get-order'
import { ListAllOrders } from './application/order/list-all-orders'
import { ListOrders } from './application/order/list-orders'
import { CreateOrderRequest } from './application/order-request/create-order-request'
import { ListOrderRequests } from './application/order-request/list-order-requests'
import { ListNewsletterSubscribers } from './application/newsletter/list-newsletter-subscribers'
import { SubscribeNewsletter } from './application/newsletter/subscribe-newsletter'
import { CreateProduct } from './application/product/create-product'
import { GetProduct } from './application/product/get-product'
import { ListProducts } from './application/product/list-products'
import { UpdateProduct } from './application/product/update-product'

import { prisma } from './infra/database/prisma/client'
import { PrismaCartRepository } from './infra/database/prisma/prisma-cart.repository'
import { PrismaCustomerRepository } from './infra/database/prisma/prisma-customer.repository'
import { PrismaFlavorRepository } from './infra/database/prisma/prisma-flavor.repository'
import { PrismaOrderAdminRepository } from './infra/database/prisma/prisma-order-admin.repository'
import { PrismaOrderRepository } from './infra/database/prisma/prisma-order.repository'
import { PrismaOrderRequestRepository } from './infra/database/prisma/prisma-order-request.repository'
import { PrismaNewsletterSubscriberRepository } from './infra/database/prisma/prisma-newsletter-subscriber.repository'
import { PrismaPasswordResetCodeRepository } from './infra/database/prisma/prisma-password-reset-code.repository'
import { PrismaProductRepository } from './infra/database/prisma/prisma-product.repository'
import { BrevoMailProvider } from './infra/providers/brevo-mail-provider'
import { ConsoleMailProvider } from './infra/providers/console-mail-provider'
import { CryptoCodeGenerator, UuidGenerator } from './infra/providers/crypto-generators'
import { CryptoHashProvider } from './infra/providers/crypto-hash-provider'
import { HmacTokenProvider } from './infra/providers/hmac-token-provider'

/**
 * Composition root: the only place that knows how concrete implementations are
 * wired together. Everything else depends on abstractions.
 */
export function buildContainer() {
  // --- Adapters / providers -------------------------------------------------
  const hasher = new CryptoHashProvider()
  const tokens = new HmacTokenProvider(env.jwtSecret, env.tokenTtlSeconds)
  const mail =
    env.mail.brevoApiKey && env.mail.fromEmail
      ? new BrevoMailProvider(env.mail.brevoApiKey, env.mail.fromEmail, env.mail.fromName)
      : new ConsoleMailProvider()
  const ids = new UuidGenerator()
  const codes = new CryptoCodeGenerator()

  // --- Repositories -------------------------------------------------------
  const customerRepo = new PrismaCustomerRepository(prisma)
  const resetCodeRepo = new PrismaPasswordResetCodeRepository(prisma)
  const productRepo = new PrismaProductRepository(prisma)
  const flavorRepo = new PrismaFlavorRepository(prisma)
  const cartRepo = new PrismaCartRepository(prisma)
  const orderRepo = new PrismaOrderRepository(prisma)
  const orderAdminRepo = new PrismaOrderAdminRepository(prisma)
  const orderRequestRepo = new PrismaOrderRequestRepository(prisma)
  const newsletterRepo = new PrismaNewsletterSubscriberRepository(prisma)

  // --- Use cases ---------------------------------------------------------
  return {
    tokens,
    useCases: {
      registerCustomer: new RegisterCustomer(customerRepo, hasher, ids),
      authenticateCustomer: new AuthenticateCustomer(customerRepo, hasher, tokens),
      getCustomerProfile: new GetCustomerProfile(customerRepo),

      requestPasswordReset: new RequestPasswordReset(
        customerRepo,
        resetCodeRepo,
        hasher,
        mail,
        ids,
        codes,
        env.passwordResetTtlMinutes,
      ),
      resetPassword: new ResetPassword(customerRepo, resetCodeRepo, hasher),

      createProduct: new CreateProduct(productRepo, flavorRepo, ids),
      updateProduct: new UpdateProduct(productRepo, flavorRepo),
      listProducts: new ListProducts(productRepo),
      getProduct: new GetProduct(productRepo),

      createFlavor: new CreateFlavor(flavorRepo, ids),
      updateFlavor: new UpdateFlavor(flavorRepo),
      listFlavors: new ListFlavors(flavorRepo),

      getCart: new GetCart(cartRepo, productRepo, flavorRepo, ids),
      addCartItem: new AddCartItem(cartRepo, productRepo, flavorRepo, ids),
      updateCartItem: new UpdateCartItem(cartRepo, productRepo, flavorRepo),
      removeCartItem: new RemoveCartItem(cartRepo, productRepo, flavorRepo),
      clearCart: new ClearCart(cartRepo, productRepo, flavorRepo),

      createOrder: new CreateOrder(cartRepo, orderRepo, productRepo, flavorRepo, ids),
      listOrders: new ListOrders(orderRepo),
      getOrder: new GetOrder(orderRepo),

      listAllOrders: new ListAllOrders(orderAdminRepo),
      getAdminOrder: new GetAdminOrder(orderAdminRepo),
      getAdminDashboardSummary: new GetAdminDashboardSummary(orderAdminRepo),
      confirmOrder: new ConfirmOrder(orderRepo, orderAdminRepo),
      denyOrder: new DenyOrder(orderRepo, orderAdminRepo),

      createOrderRequest: new CreateOrderRequest(orderRequestRepo, ids),
      listOrderRequests: new ListOrderRequests(orderRequestRepo),

      subscribeNewsletter: new SubscribeNewsletter(newsletterRepo, ids),
      listNewsletterSubscribers: new ListNewsletterSubscribers(newsletterRepo),
    },
  }
}

export type Container = ReturnType<typeof buildContainer>
