/**
 * Modelos que representan la forma en que Firebase Auth / la API expone usuarios.
 * NO usar estos tipos fuera de la capa de servicios/adapters.
 */

// ─── Respuesta de Firebase Auth (idToken) ──────────────────────────────────────

export interface FirebaseUserApiResponse {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  /** Token de autenticación que devuelve Firebase (idToken) */
  idToken: string
  /** Rol almacenado en custom claims de Firebase */
  role?: string
}

// ─── Custom claims que se almacenan en el token de Firebase ───────────────────

export interface FirebaseCustomClaims {
  role: 'admin' | 'viewer'
}

// ─── Modelo de la app para el usuario autenticado ─────────────────────────────

export interface AppUser {
  uid: string
  email: string
  role: string
  idToken: string
}
