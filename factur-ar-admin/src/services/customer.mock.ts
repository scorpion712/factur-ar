/**
 * Implementación MOCK del servicio de clientes.
 * Opera sobre un array en memoria con un delay simulado.
 * Mantiene el mismo contrato que customerService (ICustomerService).
 */

import type { Customer } from '../types/customer'
import type { ICustomerService } from './contracts'

// ─── Datos iniciales ───────────────────────────────────────────────────────────

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'client_001',
    razonSocial: 'Empresa ABC SA',
    CUIT: '30123456789',
    puntoVenta: 1,
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    certificate: '-----BEGIN CERTIFICATE-----\nMIID...(mock)...\n-----END CERTIFICATE-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...(mock)...\n-----END PRIVATE KEY-----',
    accessToken: 'afip_token_abc123',
    active: true,
    paymentValid: true,
    lastPaymentCheck: '2026-05-01',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-05-01T14:30:00Z',
  },
  {
    id: 'client_002',
    razonSocial: 'Distribuciones XYZ SRL',
    CUIT: '30234567890',
    puntoVenta: 5,
    condicionIva: 'MONOTRIBUTISTA',
    certificate: '-----BEGIN CERTIFICATE-----\nMIID...(mock)...\n-----END CERTIFICATE-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...(mock)...\n-----END PRIVATE KEY-----',
    accessToken: 'afip_token_xyz789',
    active: true,
    paymentValid: false,
    lastPaymentCheck: '2026-04-15',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-04-15T11:00:00Z',
  },
  {
    id: 'client_003',
    razonSocial: 'Servicios Delta SA',
    CUIT: '30345678901',
    puntoVenta: 10,
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    certificate: '-----BEGIN CERTIFICATE-----\nMIID...(mock)...\n-----END CERTIFICATE-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...(mock)...\n-----END PRIVATE KEY-----',
    accessToken: 'afip_token_delta456',
    active: false,
    paymentValid: false,
    createdAt: '2025-11-10T08:00:00Z',
    updatedAt: '2026-03-01T16:00:00Z',
  },
]

// ─── Estado en memoria ─────────────────────────────────────────────────────────

let store: Customer[] = [...INITIAL_CUSTOMERS]
let counter = INITIAL_CUSTOMERS.length + 1

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function now(): string {
  return new Date().toISOString()
}

// ─── Implementación ────────────────────────────────────────────────────────────

export const customerMock: ICustomerService = {
  async getAll(_token) {
    await delay()
    return [...store]
  },

  async getById(id, _token) {
    await delay(200)
    const customer = store.find((c) => c.id === id)
    if (!customer) throw new Error(`Cliente ${id} no encontrado`)
    return { ...customer }
  },

  async create(form, _token) {
    await delay()

    // Simula leer el archivo — en mock usamos el nombre del archivo
    const certificateContent = form.certificate?.[0]
      ? `-----BEGIN CERTIFICATE-----\n(${form.certificate[0].name})\n-----END CERTIFICATE-----`
      : ''
    const privateKeyContent = form.privateKey?.[0]
      ? `-----BEGIN PRIVATE KEY-----\n(${form.privateKey[0].name})\n-----END PRIVATE KEY-----`
      : ''

    const newCustomer: Customer = {
      id: `client_${String(counter++).padStart(3, '0')}`,
      razonSocial: form.razonSocial.trim(),
      CUIT: form.CUIT.trim(),
      puntoVenta: form.puntoVenta,
      condicionIva: form.condicionIva,
      certificate: certificateContent,
      privateKey: privateKeyContent,
      accessToken: form.accessToken.trim(),
      active: form.active,
      paymentValid: form.paymentValid,
      createdAt: now(),
      updatedAt: now(),
    }

    store = [...store, newCustomer]
    return { ...newCustomer }
  },

  async update(id, form, _token) {
    await delay()

    const idx = store.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Cliente ${id} no encontrado`)

    const existing = store[idx]
    const updated: Customer = {
      ...existing,
      ...(form.razonSocial !== undefined && { razonSocial: form.razonSocial.trim() }),
      ...(form.puntoVenta !== undefined && { puntoVenta: form.puntoVenta }),
      ...(form.condicionIva !== undefined && { condicionIva: form.condicionIva }),
      ...(form.accessToken !== undefined && { accessToken: form.accessToken.trim() }),
      ...(form.active !== undefined && { active: form.active }),
      ...(form.paymentValid !== undefined && { paymentValid: form.paymentValid }),
      updatedAt: now(),
    }

    store = store.map((c) => (c.id === id ? updated : c))
    return { ...updated }
  },

  async remove(id, _token) {
    await delay(200)
    store = store.map((c) =>
      c.id === id ? { ...c, active: false, updatedAt: now() } : c
    )
  },
}
