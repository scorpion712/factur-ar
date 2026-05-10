import { create } from 'zustand'
import { clearAuthCookie, setAuthCookie } from '../lib/auth/cookie'
import { auth as authService } from '../services'
import type { AppUser } from '../lib/api/auth/auth.api-model'

// ─── Estado ────────────────────────────────────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean
  user: AppUser | null

  // Operaciones
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Inicializa la escucha de cambios de sesión (llamar una sola vez al montar la app) */
  initAuthListener: () => () => void
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  signIn: async (email, password) => {
    const user = await authService.signIn(email, password)
    setAuthCookie(user.idToken)
    set({ isAuthenticated: true, user })
  },

  logout: async () => {
    await authService.signOut()
    clearAuthCookie()
    set({ isAuthenticated: false, user: null })
  },

  initAuthListener: () => {
    return authService.onAuthStateChanged((user) => {
      if (user) {
        set({ isAuthenticated: true, user })
      } else {
        set({ isAuthenticated: false, user: null })
      }
    })
  },
}))
