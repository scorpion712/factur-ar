// Mock bcrypt for demo - in production use bcryptjs
// This simulates password hashing for demo purposes
const DEMO_USERS: Record<string, string> = {
  'admin@facturar.com': 'Admin@12345678',
  'demo@facturar.com': 'Demo@12345678',
}

export async function hashPassword(password: string): Promise<string> {
  // In production: return bcrypt.hash(password, 12)
  // For demo, return a simple hash indicator
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt-factor')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, _hash: string): Promise<boolean> {
  // In production: return bcrypt.compare(password, hash)
  // For demo, check against mock users
  return DEMO_USERS['admin@facturar.com'] === password || DEMO_USERS['demo@facturar.com'] === password
}

export async function comparePassword(inputPassword: string, storedHash: string): Promise<boolean> {
  return verifyPassword(inputPassword, storedHash)
}
