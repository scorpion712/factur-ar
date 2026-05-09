/**
 * Firestore type definitions for the POS Jero cloud function.
 * These types represent data structures stored in Firestore collections.
 */

/**
 * AFIP configuration for a client.
 * Contains credentials and certificate data required for invoice generation.
 */
export interface AfipConfig {
  /** Clave Única de Identificación Tributaria - Tax ID */
  CUIT: string;
  /** Razón Social - Company legal name */
  razonSocial: string;
  /** Punto de Venta (POS number) */
  puntoVenta: number;
  /** Condición ante el IVA (IVA condition: responsable inscripto, monotributista, etc.) */
  condicionIva: string;
  /** Encrypted certificate for AFIP authentication */
  encryptedCert: string;
  /** Encrypted private key for AFIP authentication */
  encryptedKey: string;
  /** Access token for AFIP Web Services */
  accessToken: string;
}

/**
 * Client configuration data stored in Firestore.
 * Includes API key, encryption settings, and AFIP credentials.
 */
export interface ClientData {
  /** SHA-256 hash of the client's API key */
  apiKeyHash: string;
  /** Whether the client is active and can make requests */
  active: boolean;
  /** ID of the encryption key used for sensitive data */
  encryptionKeyId: string;
  /** AFIP configuration */
  afip: AfipConfig;
  /** When this client configuration was created */
  createdAt: Date;
  /** When this client configuration was last updated */
  updatedAt: Date;
}

/**
 * Client configuration snapshot returned by queries.
 * Same as ClientData but includes the clientId for reference.
 */
export interface ClientConfigSnapshot {
  /** The client's unique identifier */
  clientId: string;
  /** SHA-256 hash of the client's API key */
  apiKeyHash: string;
  /** Whether the client is active */
  active: boolean;
  /** ID of the encryption key used for sensitive data */
  encryptionKeyId: string;
  /** AFIP configuration */
  afip: AfipConfig;
}

/**
 * Voucher (invoice) data structure.
 * Represents an electronic invoice sent to AFIP.
 */
export interface VoucherData {
  /** Type of invoice (1=Factura A, 6=Factura B, etc.) - AFIP Comprobante tipo */
  tipoFactura: number;
  /** Invoice number */
  numero: number;
  /** CAE (Código de Autorización de Electrónico) - Authorization code from AFIP */
  cae: string;
  /** CAE expiration date (YYYYMMDD format) */
  caeVto: string;
  /** QR Code data for the electronic invoice */
  qrData: string;
  /** Punto de Venta (POS/branch number) */
  puntoVenta: number;
  /** Document type (80=CUIT, 96=DNI, etc.) */
  docTipo: number;
  /** Document number (client's tax ID) */
  docNro: number;
  /** Total amount including IVA */
  impTotal: number;
}

/**
 * Voucher number lock data for concurrent number allocation.
 * Used to prevent duplicate voucher numbers when multiple requests happen simultaneously.
 */
export interface VoucherNumberData {
  /** The last issued voucher number for this point-of-sale + invoice type combination */
  lastNumber: number;
  /** Whether the number is currently locked (being used in a transaction) */
  locked: boolean;
  /** Timestamp when the lock was acquired */
  lockedAt?: number;
  /** Timestamp when the lock was released */
  unlockedAt?: number;
}

/**
 * TA (Token de Acceso) cache data.
 * Stores AFIP authentication tokens to avoid repeated login requests.
 */
export interface TACacheData {
  /** AFIP access token */
  token: string;
  /** AFIP sign token */
  sign: string;
  /** Unix timestamp when the token expires */
  expiresAt: number;
  /** Unix timestamp when the token was last refreshed */
  refreshedAt: number;
}

/**
 * Secret key data structure for encrypted credentials.
 */
export interface SecretKeyData {
  /** The encrypted key value */
  encryptedKey: string;
}
