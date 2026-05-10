/**
 * Implementación MOCK del servicio de autenticación.
 * Simula Firebase Auth con credenciales hardcodeadas para desarrollo.
 */

import type { IAuthService } from './contracts'
import type { AppUser } from '../lib/api/auth/auth.api-model'

// ─── Credenciales válidas en modo mock ─────────────────────────────────────────

const MOCK_CREDENTIALS: Record<string, { password: string; role: string }> = {
  'admin@facturar.com': { password: 'Admin@12345678', role: 'admin' },
  'demo@facturar.com': { password: 'Demo@12345678', role: 'viewer' },
}

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let currentUser: AppUser | null = null
const listeners = new Set<(user: AppUser | null) => void>()

function notifyListeners(user: AppUser | null): void {
  listeners.forEach((cb) => cb(user))
}

export const authMock: IAuthService = {
  async signIn(email, password) {
    await delay()

    const entry = MOCK_CREDENTIALS[email.toLowerCase()]

    if (!entry || entry.password !== password) {
      throw new Error('Credenciales inválidas')
    }

    const user: AppUser = {
      uid: `mock_uid_${email.split('@')[0]}`,
      email,
      role: entry.role,
      idToken: `mock_token_${Date.now()}`,
    }

    currentUser = user
    notifyListeners(user)
    return user
  },

  async signOut() {
    await delay(200)
    currentUser = null
    notifyListeners(null)
  },

  onAuthStateChanged(callback) {
    listeners.add(callback)
    // Notifica inmediatamente con el estado actual
    callback(currentUser)
    return () => {
      listeners.delete(callback)
    }
  },
}
