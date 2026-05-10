/**
 * Adapter: transforma entre el modelo de la API (snake_case) y el modelo
 * de la aplicación (camelCase definido en src/types/customer.ts).
 *
 * - fromApi → convierte la respuesta de la API al modelo del front
 * - toCreatePayload → convierte el formulario al payload de creación
 * - toUpdatePayload → convierte el formulario al payload de actualización
 */

import type { Customer, CustomerFormData } from '../../../types/customer'
import type {
  CustomerApiResponse,
  CreateCustomerApiPayload,
  UpdateCustomerApiPayload,
} from './customer.api-model'

// ─── API → App ─────────────────────────────────────────────────────────────────

export function customerFromApi(raw: CustomerApiResponse): Customer {
  return {
    id: raw.id,
    razonSocial: raw.razon_social,
    CUIT: raw.cuit,
    puntoVenta: raw.punto_venta,
    condicionIva: raw.condicion_iva,
    certificate: raw.certificate,
    privateKey: raw.private_key,
    accessToken: raw.access_token,
    active: raw.active,
    paymentValid: raw.payment_valid,
    lastPaymentCheck: raw.last_payment_check ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

// ─── App → API (crear) ─────────────────────────────────────────────────────────

export function customerToCreatePayload(
  form: CustomerFormData,
  certificateContent: string,
  privateKeyContent: string,
): CreateCustomerApiPayload {
  return {
    razon_social: form.razonSocial.trim(),
    cuit: form.CUIT.trim(),
    punto_venta: form.puntoVenta,
    condicion_iva: form.condicionIva,
    certificate: certificateContent,
    private_key: privateKeyContent,
    access_token: form.accessToken.trim(),
    active: form.active,
    payment_valid: form.paymentValid,
  }
}

// ─── App → API (actualizar) ────────────────────────────────────────────────────

export function customerToUpdatePayload(
  form: Partial<CustomerFormData>,
  certificateContent?: string,
  privateKeyContent?: string,
): UpdateCustomerApiPayload {
  const payload: UpdateCustomerApiPayload = {}

  if (form.razonSocial !== undefined) payload.razon_social = form.razonSocial.trim()
  if (form.puntoVenta !== undefined) payload.punto_venta = form.puntoVenta
  if (form.condicionIva !== undefined) payload.condicion_iva = form.condicionIva
  if (form.accessToken !== undefined) payload.access_token = form.accessToken.trim()
  if (form.active !== undefined) payload.active = form.active
  if (form.paymentValid !== undefined) payload.payment_valid = form.paymentValid
  if (certificateContent) payload.certificate = certificateContent
  if (privateKeyContent) payload.private_key = privateKeyContent

  return payload
}
