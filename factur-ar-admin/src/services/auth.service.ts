/**
 * Implementación REAL del servicio de autenticación con Firebase Auth.
 *
 * Para activar:
 * 1. Descomentar el bloque de Firebase en src/lib/firebase/config.ts
 * 2. En src/services/index.ts cambiar USE_MOCK a false
 */

import type { IAuthService } from './contracts'

// ─── Imports de Firebase (comentados hasta tener credenciales) ─────────────────
// import {
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged as firebaseOnAuthStateChanged,
//   type User as FirebaseUser,
// } from 'firebase/auth'
// import { firebaseAuth } from '../lib/firebase/config'

// ─── Helper para convertir FirebaseUser → AppUser ─────────────────────────────
// async function toAppUser(firebaseUser: FirebaseUser): Promise<AppUser> {
//   const idToken = await firebaseUser.getIdToken()
//   const tokenResult = await firebaseUser.getIdTokenResult()
//   return userFromFirebase({
//     uid: firebaseUser.uid,
//     email: firebaseUser.email,
//     displayName: firebaseUser.displayName,
//     emailVerified: firebaseUser.emailVerified,
//     idToken,
//     role: tokenResult.claims['role'] as string | undefined,
//   })
// }

export const authService: IAuthService = {
  signIn(_email, _password) {
    // ── Implementación real (descomentar cuando Firebase esté configurado) ──
    // if (!firebaseAuth) throw new Error('Firebase Auth no inicializado')
    // const credential = await signInWithEmailAndPassword(firebaseAuth, _email, _password)
    // return toAppUser(credential.user)

    return Promise.reject(
      new Error('Firebase Auth no está configurado. Usá USE_MOCK = true en services/index.ts')
    )
  },

  signOut() {
    // ── Implementación real ──
    // if (!firebaseAuth) return
    // await signOut(firebaseAuth)

    return Promise.reject(
      new Error('Firebase Auth no está configurado. Usá USE_MOCK = true en services/index.ts')
    )
  },

  onAuthStateChanged(_callback) {
    // ── Implementación real ──
    // if (!firebaseAuth) return () => {}
    // const unsubscribe = firebaseOnAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    //   if (!firebaseUser) {
    //     _callback(null)
    //     return
    //   }
    //   const user = await toAppUser(firebaseUser)
    //   _callback(user)
    // })
    // return unsubscribe

    // Fallback cuando no hay Firebase: nunca llama al callback
    return () => {}
  },
}


