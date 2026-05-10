import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'facturar-dev-secret-change-in-production'
)

const JWT_ISSUER = 'facturar-admin'
const JWT_AUDIENCE = 'facturar-admin-users'

export interface JWTPayload {
  sub: string
  email: string
  role: string
}

export interface JWTClaims extends JWTPayload {
  iat: number
  exp: number
}

export async function signToken(payload: Omit<JWTPayload, never>): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTClaims | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    return payload as unknown as JWTClaims
  } catch {
    return null
  }
}

export async function decodeToken(token: string): Promise<JWTClaims | null> {
  try {
    const { payload } = jose.decodeJwt(token)
    return payload as unknown as JWTClaims
  } catch {
    return null
  }
}
