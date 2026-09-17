// ------------------------------------------------------------------
// src/config/firebase.js
// ------------------------------------------------------------------
// Inicialização do Firebase (App + Firestore + Auth) da JPS Steel.
// As credenciais são lidas de variáveis de ambiente (Vite):
//
//   .env  ->  VITE_FIREBASE_API_KEY=...
//             VITE_FIREBASE_AUTH_DOMAIN=...
//             VITE_FIREBASE_PROJECT_ID=...
//             VITE_FIREBASE_STORAGE_BUCKET=...
//             VITE_FIREBASE_MESSAGING_SENDER_ID=...
//             VITE_FIREBASE_APP_ID=...
//
// Se as variáveis não estiverem preenchidas, o sistema segue
// funcionando graças a uma camada de dados "modo demonstração"
// (mock) definida em src/services/mockData.js.
// ------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Indica se o Firebase foi devidamente configurado nas variáveis de ambiente.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
)

/** Instância do app Firebase (null se não configurado). */
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

/** Instância do Firestore (null se não configurado). */
export const db = isFirebaseConfigured ? getFirestore(app) : null

/** Instância do Authentication (null se não configurado). */
export const auth = isFirebaseConfigured ? getAuth(app) : null

/**
 * Converte um valor armazenado no Firestore em uma data JS nativa.
 * Aceita: Date nativo, Timestamp do Firestore, string ISO ou número (epoch ms).
 * @param {unknown} value
 * @returns {Date | null}
 */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    // Timestamp do Firestore
    return value.toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}