/**
 * Firebase Configuration
 *
 * Para activar Firebase:
 * 1. Crea un proyecto en https://console.firebase.google.com
 * 2. Copia las credenciales del proyecto en el .env:
 *    VITE_FIREBASE_API_KEY=...
 *    VITE_FIREBASE_AUTH_DOMAIN=...
 *    VITE_FIREBASE_PROJECT_ID=...
 *    VITE_FIREBASE_STORAGE_BUCKET=...
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *    VITE_FIREBASE_APP_ID=...
 * 3. En src/services/index.ts cambia USE_MOCK a false
 */

// import { initializeApp, type FirebaseApp } from 'firebase/app'
// import { getAuth, type Auth } from 'firebase/auth'

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// }

// const app: FirebaseApp = initializeApp(firebaseConfig)
// export const firebaseAuth: Auth = getAuth(app)
// export { app }

// Placeholder para cuando Firebase no está inicializado
export const firebaseAuth = null
