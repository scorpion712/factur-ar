/**
 * HTTP Client base con soporte para token Bearer.
 * Todas las llamadas a la API REST pasan por aquí.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.facturar.com/v1'

export interface ApiError {
  status: number
  message: string
  code?: string
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor({ status, message, code }: ApiError) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new HttpError({
      status: response.status,
      message: typeof body === 'object' ? (body.message ?? 'Error desconocido') : body,
      code: typeof body === 'object' ? body.code : undefined,
    })
  }

  return body as T
}

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const httpClient = {
  get<T>(path: string, token?: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: buildHeaders(token),
    }).then((r) => parseResponse<T>(r))
  },

  post<T>(path: string, body: unknown, token?: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => parseResponse<T>(r))
  },

  put<T>(path: string, body: unknown, token?: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => parseResponse<T>(r))
  },

  patch<T>(path: string, body: unknown, token?: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    }).then((r) => parseResponse<T>(r))
  },

  delete<T>(path: string, token?: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    }).then((r) => parseResponse<T>(r))
  },
}
