import { PasswordResetCode } from './password-reset-code'

export interface PasswordResetCodeRepository {
  create(code: PasswordResetCode): Promise<void>
  save(code: PasswordResetCode): Promise<void>
  /** Most recently issued code that is still valid (not consumed, not expired). */
  findLatestUsableByCustomer(customerId: string): Promise<PasswordResetCode | null>
  /** Consume every outstanding code for the customer (e.g. after a successful reset). */
  invalidateAllForCustomer(customerId: string, now?: Date): Promise<void>
}
