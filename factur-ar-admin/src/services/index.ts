/**
 * ┌─────────────────────────────────────────────────────────┐
 * │                  MODO DE DATOS                          │
 * │                                                         │
 * │  true  → datos mockeados (sin Firebase, sin API)        │
 * │  false → Firebase Auth + API REST real                  │
 * │                                                         │
 * │  Cambiá SOLO esta línea para alternar entre modos.      │
 * └─────────────────────────────────────────────────────────┘
 */
const USE_MOCK = true

// ─── Customer Service ──────────────────────────────────────────────────────────

import { customerMock } from './customer.mock'
import { customerService } from './customer.service'
import type { ICustomerService } from './contracts'

export const customers: ICustomerService = USE_MOCK ? customerMock : customerService

// ─── Auth Service ──────────────────────────────────────────────────────────────

import { authMock } from './auth.mock'
import { authService } from './auth.service'
import type { IAuthService } from './contracts'

export const auth: IAuthService = USE_MOCK ? authMock : authService

// ─── Re-export de contratos para consumidores ──────────────────────────────────

export type { ICustomerService, IAuthService }
