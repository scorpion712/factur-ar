/**
 * Adapter: transforma el modelo de Firebase Auth al modelo interno de la app.
 *
 * - userFromFirebase → convierte FirebaseUserApiResponse → AppUser
 */

import type { FirebaseUserApiResponse, AppUser } from './auth.api-model'

export function userFromFirebase(raw: FirebaseUserApiResponse): AppUser {
  return {
    uid: raw.uid,
    email: raw.email ?? '',
    role: raw.role ?? 'viewer',
    idToken: raw.idToken,
  }
}
