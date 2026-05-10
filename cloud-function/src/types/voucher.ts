/**
 * Voucher (invoice) type definitions and constants.
 * Defines AFIP-specific codes and calculation helpers.
 */

// =============================================================================
// Bill Type Enums - AFIP Comprobante Types
// =============================================================================

/**
 * Bill type codes used in AFIP.
 * Corresponds to "Tipo de Comprobante" in AFIP regulations.
 *
 * Facturas (Invoices):
 * - 1: Factura A (registered responsible)
 * - 6: Factura B (final consumer)
 * - 11: Factura C (monotributista)
 *
 * Notas de Crédito (Credit Notes):
 * - 3: Nota de Crédito A
 * - 8: Nota de Crédito B
 * - 13: Nota de Crédito C
 */
export enum BillType {
  FACTURA_A = 1,
  FACTURA_B = 6,
  FACTURA_C = 11,
  NOTA_CREDITO_A = 3,
  NOTA_CREDITO_B = 8,
  NOTA_CREDITO_C = 13,
}

/**
 * User-friendly bill type identifiers used in the API.
 */
export type BillTypeKey =
  | "factura_a"
  | "factura_b"
  | "factura_c"
  | "nota_credito_a"
  | "nota_credito_b"
  | "nota_credito_c";

/**
 * Mapping from user-friendly bill type keys to AFIP bill type codes.
 */
export const BILL_TYPE_MAP: Record<BillTypeKey, {tipo: BillType; tipoNC: BillType}> = {
  factura_a: {tipo: BillType.FACTURA_A, tipoNC: BillType.NOTA_CREDITO_A},
  factura_b: {tipo: BillType.FACTURA_B, tipoNC: BillType.NOTA_CREDITO_B},
  factura_c: {tipo: BillType.FACTURA_C, tipoNC: BillType.NOTA_CREDITO_C},
  nota_credito_a: {tipo: BillType.NOTA_CREDITO_A, tipoNC: BillType.NOTA_CREDITO_A},
  nota_credito_b: {tipo: BillType.NOTA_CREDITO_B, tipoNC: BillType.NOTA_CREDITO_B},
  nota_credito_c: {tipo: BillType.NOTA_CREDITO_C, tipoNC: BillType.NOTA_CREDITO_C},
};

// =============================================================================
// Document Type Enums - AFIP Document Types
// =============================================================================

/**
 * Document type codes for AFIP.
 * Corresponds to "Tipo de Documento" in AFIP regulations.
 */
export enum DocumentType {
  CUIT = 80, // Clave Única de Identificación Tributaria
  DNI = 96, // Documento Nacional de Identidad
  CUIL = 86, // Clave Única de Identificación Laboral
  LE = 89, // Libreta de Enrolamiento
  LC = 90, // Libreta de Ciudadanía
}

/**
 * User-friendly document type identifiers.
 */
export type DocumentTypeKey = "CUIT" | "DNI" | "CUIL" | "LE" | "LC";

/**
 * Default document type when not specified or unknown.
 */
export const DEFAULT_DOC_TYPE = 99;

/**
 * Mapping from user-friendly document type keys to AFIP codes.
 */
export const DOC_TYPE_MAP: Record<DocumentTypeKey, DocumentType> = {
  CUIT: DocumentType.CUIT,
  DNI: DocumentType.DNI,
  CUIL: DocumentType.CUIL,
  LE: DocumentType.LE,
  LC: DocumentType.LC,
};

// =============================================================================
// IVA (VAT) Constants
// =============================================================================

/**
 * IVA rate configuration for AFIP.
 * Each rate has an AFIP ID and the percentage value.
 */
export const IVA_RATES = {
  /** 21% - Standard IVA rate (most common) */
  IVA_21: {id: 5, rate: 21},
  /** 10% - Reduced IVA rate */
  IVA_10: {id: 4, rate: 10},
  /** 27% - Increased IVA rate */
  IVA_27: {id: 6, rate: 27},
} as const;

/**
 * IVA multiplier for calculations.
 * 21% = divide by 1.21 to extract IVA from gross amount.
 */
export const IVA_MULTIPLIER = 1.21;

/**
 * The standard IVA rate ID used for consumer invoices (21%).
 * Used in AFIP's ivaArray field.
 */
export const STANDARD_IVA_ID = IVA_RATES.IVA_21.id;

// =============================================================================
// Bill Types that require IVA (VAT)
// =============================================================================

/**
 * Bill types that require IVA calculation.
 * Factura A and B require IVA, while Factura C and notes may vary.
 */
export const IVA_REQUIRED_BILL_TYPES = [
  BillType.FACTURA_A,
  BillType.FACTURA_B,
];

/**
 * Checks if a bill type requires IVA calculation.
 */
export function requiresIVA(billType: BillType): boolean {
  return IVA_REQUIRED_BILL_TYPES.includes(billType);
}

// =============================================================================
// IVA Calculation Helper
// =============================================================================

/**
 * Calculates the IVA (VAT) component from a gross amount.
 *
 * @param importeTotal - The total gross amount (including IVA)
 * @param ivaRate - The IVA rate percentage (default: 21%)
 * @returns Object with net amount and IVA amount
 */
export function calculateIVA(
  importeTotal: number,
  ivaRate: number = IVA_RATES.IVA_21.rate
): {impNeto: number; impIVA: number} {
  const multiplier = 1 + ivaRate / 100;
  const impNeto = Number((importeTotal / multiplier).toFixed(2));
  const impIVA = Number((importeTotal - impNeto).toFixed(2));
  return {impNeto, impIVA};
}

// =============================================================================
// Voucher Input Types
// =============================================================================

/**
 * Voucher item with product details.
 */
export interface VoucherItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaId?: number;
}

/**
 * Voucher data input from the API.
 */
export interface VoucherInput {
  tipoFactura: BillTypeKey;
  docTipo: DocumentTypeKey;
  docNro: number;
  items: VoucherItem[];
  descuento?: number;
  nroAsociado?: number;
}

/**
 * Decrypted AFIP credentials for a client.
 */
export interface DecryptedCredentials {
  accessToken: string;
  cert: string;
  key: string;
  CUIT: string;
}

/**
 * Complete input for creating a voucher.
 */
export interface CreateVoucherInput {
  clientId: string;
  credentials: DecryptedCredentials;
  voucherData: VoucherInput;
  puntoVenta: number;
}
