export interface Customer {
  id: string;
  razonSocial: string;
  CUIT: string;
  puntoVenta: number;
  condicionIva: string;
  certificate: string;
  privateKey: string;
  accessToken: string;
  active: boolean;
  paymentValid: boolean;
  lastPaymentCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export type CondicionIva =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTISTA'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL';

export const CONDICION_IVA_OPTIONS: { value: CondicionIva; label: string }[] = [
  { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { value: 'MONOTRIBUTISTA', label: 'Monotributista' },
  { value: 'EXENTO', label: 'Exento' },
  { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
];

export interface CustomerFormData {
  razonSocial: string;
  CUIT: string;
  puntoVenta: number;
  condicionIva: CondicionIva;
  accessToken: string;
  certificate?: FileList;
  privateKey?: FileList;
  active: boolean;
  paymentValid: boolean;
}

// ─── Detail types ──────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  reference?: string;
}

export type PlanId = 'base' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  features: string[];
}

export interface PlanChange {
  id: string;
  date: string;
  fromPlan: string;
  toPlan: string;
  changedBy: string;
}

export type POSStatus = 'active' | 'inactive';

export interface PointOfSale {
  id: string;
  name: string;
  address: string;
  status: POSStatus;
  createdAt: string;
}