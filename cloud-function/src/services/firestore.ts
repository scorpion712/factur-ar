/**
 * Firestore service module.
 * Provides database access functions for the POS Jero cloud function.
 *
 * This module handles:
 * - Firestore initialization with Google Application Credentials
 * - Client configuration CRUD operations
 * - Voucher data storage
 * - TA (Token de Acceso) cache management
 * - Secret keys retrieval
 *
 * Note: Voucher number locking is handled by the separate `voucherNumber.ts` module.
 */

import {initializeApp, cert, getApps} from "firebase-admin/app";
import {getFirestore, Firestore} from "firebase-admin/firestore";

import type {
  ClientConfigSnapshot,
  ClientData,
  VoucherData,
  TACacheData,
} from "../types/firestore.js";

// =============================================================================
// Initialization
// =============================================================================

/** Firestore instance - singleton pattern */
let db: Firestore | null = null;

/**
 * Initializes the Firestore connection if not already initialized.
 * Uses Google Application Credentials from environment variable.
 *
 * @returns The Firestore instance
 * @throws Error if GOOGLE_APPLICATION_CREDENTIALS is not set
 *
 * @internal
 */
function initializeFirestore(): Firestore {
  if (db) {
    return db;
  }

  if (getApps().length === 0) {
    const crt = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!crt) {
      throw new Error(
        "FATAL: GOOGLE_APPLICATION_CREDENTIALS environment variable is required"
      );
    }

    initializeApp({
      credential: cert(JSON.parse(crt)),
    });
  }

  db = getFirestore();
  return db;
}

/**
 * Gets the Firestore database instance.
 * Initializes on first call, then returns cached instance.
 */
export function getDatabase(): Firestore {
  return initializeFirestore();
}

// =============================================================================
// Client Configuration
// =============================================================================

/**
 * Collection path for client configurations.
 * Structure: clients/{clientId}/_config
 */
const CLIENT_CONFIG_PATH = "_config";

/**
 * Gets the client configuration from Firestore.
 *
 * @param clientId - The client's unique identifier
 * @returns Client config snapshot or null if not found
 */
export async function getClientConfig(
  clientId: string
): Promise<ClientConfigSnapshot | null> {
  const firestore = getDatabase();
  const doc = await firestore.doc(`clients/${clientId}/${CLIENT_CONFIG_PATH}`).get();

  if (!doc.exists) {
    return null;
  }

  return {
    clientId,
    ...doc.data() as ClientData,
  };
}

/**
 * Sets (creates or replaces) the client configuration.
 * If createdAt is not provided, uses current time.
 * Always updates the updatedAt timestamp.
 *
 * @param clientId - The client's unique identifier
 * @param data - Partial client data to set
 */
export async function setClientConfig(
  clientId: string,
  data: Partial<ClientData>
): Promise<void> {
  const firestore = getDatabase();
  const now = new Date();
  await firestore.doc(`clients/${clientId}/${CLIENT_CONFIG_PATH}`).set({
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now,
  });
}

/**
 * Updates specific fields in the client configuration.
 * Always updates the updatedAt timestamp.
 *
 * @param clientId - The client's unique identifier
 * @param data - Partial client data to update
 */
export async function updateClientConfig(
  clientId: string,
  data: Partial<ClientData>
): Promise<void> {
  const firestore = getDatabase();
  await firestore.doc(`clients/${clientId}/${CLIENT_CONFIG_PATH}`).update({
    ...data,
    updatedAt: new Date(),
  });
}

// =============================================================================
// Vouchers
// =============================================================================

/**
 * Saves a new voucher to Firestore.
 * Automatically adds createdAt timestamp.
 *
 * @param clientId - The client's unique identifier
 * @param voucher - The voucher data to save
 * @returns The generated document ID
 */
export async function saveVoucher(
  clientId: string,
  voucher: VoucherData
): Promise<string> {
  const firestore = getDatabase();
  const docRef = firestore
    .collection(`clients/${clientId}/vouchers`)
    .doc();

  await docRef.set({
    ...voucher,
    createdAt: new Date(),
  });

  return docRef.id;
}

// =============================================================================
// TA Cache (AFIP Authentication Token)
// =============================================================================

/**
 * Collection path for TA cache documents.
 * Structure: taCache/{clientId}
 */
const TA_CACHE_PATH = "taCache";

/**
 * Gets the cached TA (Token de Acceso) for a client.
 * Used to avoid repeated AFIP login requests.
 *
 * @param clientId - The client's unique identifier
 * @returns TA cache data or null if not found
 */
export async function getTACache(
  clientId: string
): Promise<TACacheData | null> {
  const firestore = getDatabase();
  const doc = await firestore.doc(`${TA_CACHE_PATH}/${clientId}`).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as TACacheData;
}

/**
 * Sets or updates the TA cache for a client.
 *
 * @param clientId - The client's unique identifier
 * @param data - The TA cache data to store
 */
export async function setTACache(
  clientId: string,
  data: TACacheData
): Promise<void> {
  const firestore = getDatabase();
  await firestore.doc(`${TA_CACHE_PATH}/${clientId}`).set(data);
}

// =============================================================================
// Secret Keys
// =============================================================================

/**
 * Collection path for encrypted secret keys.
 * Structure: secretKeys/{keyId}
 */
const SECRET_KEYS_PATH = "secretKeys";

/**
 * Retrieves an encrypted secret key by its ID.
 *
 * @param keyId - The secret key identifier
 * @returns The encrypted key string or null if not found
 */
export async function getSecretKey(
  keyId: string
): Promise<string | null> {
  const firestore = getDatabase();
  const doc = await firestore.doc(`${SECRET_KEYS_PATH}/${keyId}`).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as {encryptedKey: string};
  return data.encryptedKey;
}

// =============================================================================
// Re-export types for backward compatibility
// =============================================================================

export type {
  ClientConfigSnapshot,
  ClientData,
  VoucherData,
  TACacheData,
  VoucherNumberData,
} from "../types/firestore.js";
