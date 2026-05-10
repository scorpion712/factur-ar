/**
 * Implementación REAL del servicio de clientes.
 * Llama a la API REST y usa los adapters para transformar los datos.
 *
 * Para activar: en src/services/index.ts cambia USE_MOCK a false.
 */

import { httpClient } from '../lib/api/http-client'
import {
  customerFromApi,
  customerToCreatePayload,
  customerToUpdatePayload,
} from '../lib/api/customers/customer.adapter'
import type {
  CustomerApiResponse,
  CustomerListApiResponse,
} from '../lib/api/customers/customer.api-model'
import type { ICustomerService } from './contracts'

/** Lee un File como texto (para certificado / clave privada) */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export const customerService: ICustomerService = {
  async getAll(token) {
    const response = await httpClient.get<CustomerListApiResponse>('/customers', token)
    return response.data.map(customerFromApi)
  },

  async getById(id, token) {
    const response = await httpClient.get<CustomerApiResponse>(`/customers/${id}`, token)
    return customerFromApi(response)
  },

  async create(form, token) {
    const certificateContent = form.certificate?.[0]
      ? await readFileAsText(form.certificate[0])
      : ''
    const privateKeyContent = form.privateKey?.[0]
      ? await readFileAsText(form.privateKey[0])
      : ''

    const payload = customerToCreatePayload(form, certificateContent, privateKeyContent)
    const response = await httpClient.post<CustomerApiResponse>('/customers', payload, token)
    return customerFromApi(response)
  },

  async update(id, form, token) {
    const certificateContent =
      form.certificate?.[0] ? await readFileAsText(form.certificate[0]) : undefined
    const privateKeyContent =
      form.privateKey?.[0] ? await readFileAsText(form.privateKey[0]) : undefined

    const payload = customerToUpdatePayload(form, certificateContent, privateKeyContent)
    const response = await httpClient.patch<CustomerApiResponse>(`/customers/${id}`, payload, token)
    return customerFromApi(response)
  },

  async remove(id, token) {
    await httpClient.delete<void>(`/customers/${id}`, token)
  },
}
