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