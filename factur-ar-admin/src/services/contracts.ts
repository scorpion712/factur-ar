/**
 * Contratos (interfaces) que deben cumplir tanto la implementación
 * real como la mock. Garantizan que el switch sea transparente.
 */

import type { Customer, CustomerFormData } from '../types/customer'
import type { AppUser } from '../lib/api/auth/auth.api-model'

// ─── Customer Service ──────────────────────────────────────────────────────────

export interface ICustomerService {
  /** Devuelve todos los clientes */
  getAll(token: string): Promise<Customer[]>
  /** Devuelve un cliente por id */
  getById(id: string, token: string): Promise<Customer>
  /** Crea un cliente; lee los archivos y los convierte a texto */
  create(form: CustomerFormData, token: string): Promise<Customer>
  /** Actualiza un cliente parcialmente */
  update(id: string, form: Partial<CustomerFormData>, token: string): Promise<Customer>
  /** Soft-delete: desactiva el cliente */
  remove(id: string, token: string): Promise<void>
}

// ─── Auth Service ──────────────────────────────────────────────────────────────

export interface IAuthService {
  /** Inicia sesión con email/password */
  signIn(email: string, password: string): Promise<AppUser>
  /** Cierra sesión */
  signOut(): Promise<void>
  /**
   * Suscripción al estado de autenticación.
   * Devuelve una función para cancelar la suscripción (unsubscribe).
   */
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void
}
