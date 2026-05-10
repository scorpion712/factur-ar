/**
 * Modelos que representan la forma en que la API REST devuelve/recibe clientes.
 * Usar snake_case para respetar la convención REST habitual.
 * NO usar estos tipos fuera de la capa de servicios/adapters.
 */

// ─── Respuesta de la API ───────────────────────────────────────────────────────

export interface CustomerApiResponse {
  id: string
  razon_social: string
  cuit: string
  punto_venta: number
  condicion_iva: string
  certificate: string
  private_key: string
  access_token: string
  active: boolean
  payment_valid: boolean
  last_payment_check: string | null
  created_at: string
  updated_at: string
}

export interface CustomerListApiResponse {
  data: CustomerApiResponse[]
  total: number
  page: number
  per_page: number
}

// ─── Payload para crear ────────────────────────────────────────────────────────

export interface CreateCustomerApiPayload {
  razon_social: string
  cuit: string
  punto_venta: number
  condicion_iva: string
  certificate: string
  private_key: string
  access_token: string
  active: boolean
  payment_valid: boolean
}

// ─── Payload para actualizar ───────────────────────────────────────────────────

export type UpdateCustomerApiPayload = Partial<Omit<CreateCustomerApiPayload, 'cuit'>>
