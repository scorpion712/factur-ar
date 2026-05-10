/**
 * Voucher number management service.
 * Handles atomic voucher number allocation with locking to prevent duplicates
 * in concurrent scenarios.
 */

import {getDatabase} from "./firestore.js";
import type {VoucherNumberData} from "../types/firestore.js";

/**
 * Generates a unique document ID for the voucher number lock.
 * Format: {clientId}_{puntoVenta}_{tipoFactura}
 */
function generateVoucherLockDocId(
  clientId: string,
  puntoVenta: number,
  tipoFactura: number
): string {
  return `${clientId}_${puntoVenta}_${tipoFactura}`;
}

/**
 * Acquires a lock on the voucher number for a specific client + point-of-sale + invoice type.
 * Uses a Firestore transaction to ensure atomicity.
 *
 * This prevents duplicate voucher numbers when multiple requests arrive simultaneously:
 * - Transaction checks if a lock exists
 * - If not, creates one with number = 1
 * - If exists and unlocked, increments and locks
 * - If locked, throws an error
 *
 * @param clientId - The client's unique identifier
 * @param puntoVenta - Point of sale number (1-99999)
 * @param tipoFactura - Invoice type code (1=Factura A, 6=Factura B, etc.)
 * @returns The allocated voucher number
 * @throws Error if the voucher number is currently locked by another transaction
 */
export async function getVoucherNumberLock(
  clientId: string,
  puntoVenta: number,
  tipoFactura: number
): Promise<number> {
  const firestore = getDatabase();
  const docId = generateVoucherLockDocId(clientId, puntoVenta, tipoFactura);
  const docRef = firestore.doc(`voucherNumbers/${docId}`);

  const result = await firestore.runTransaction(async (txn) => {
    const doc = await txn.get(docRef);

    if (!doc.exists) {
      // First voucher for this combination - start at 1
      const newNumber = 1;
      txn.set(docRef, {
        lastNumber: newNumber,
        locked: true,
        lockedAt: Date.now(),
      });
      return newNumber;
    }

    const data = doc.data() as VoucherNumberData;

    if (data.locked) {
      throw new Error("Voucher number is currently locked");
    }

    // Increment and lock for this transaction
    const newNumber = data.lastNumber + 1;

    txn.set(
      docRef,
      {
        lastNumber: newNumber,
        locked: true,
        lockedAt: Date.now(),
      },
      {merge: true}
    );

    return newNumber;
  });

  return result;
}

/**
 * Releases the lock on a voucher number after successful voucher creation.
 *
 * @param clientId - The client's unique identifier
 * @param puntoVenta - Point of sale number
 * @param tipoFactura - Invoice type code
 */
export async function releaseVoucherNumberLock(
  clientId: string,
  puntoVenta: number,
  tipoFactura: number
): Promise<void> {
  const firestore = getDatabase();
  const docId = generateVoucherLockDocId(clientId, puntoVenta, tipoFactura);

  await firestore.doc(`voucherNumbers/${docId}`).update({
    locked: false,
    unlockedAt: Date.now(),
  });
}
