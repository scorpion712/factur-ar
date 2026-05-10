const COOKIE_NAME = 'facturar_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export interface CookieOptions {
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export function setAuthCookie(token: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return

  const cookieOptions = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    options.secure ?? true ? 'Secure' : '',
    `SameSite=${options.sameSite ?? 'strict'}`,
    'HttpOnly',
  ]
    .filter(Boolean)
    .join('; ')

  document.cookie = cookieOptions
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split('; ')
  const tokenCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))
  return tokenCookie ? tokenCookie.split('=')[1] : null
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure`
}

export function isCookieAvailable(): boolean {
  return typeof document !== 'undefined' && 'cookie' in document
}
