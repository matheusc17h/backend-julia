import { Customer } from './customer'

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>
  findByEmail(email: string): Promise<Customer | null>
  create(customer: Customer): Promise<void>
  save(customer: Customer): Promise<void>
}
