interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  blockedUntil: number | null
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes

// In-memory store (resets on server restart - fine for demo)
const ipStore = new Map<string, RateLimitEntry>()

function getClientIP(): string {
  // In production, get from request headers (X-Forwarded-For, etc.)
  return 'client-ip'
}

export function isRateLimited(ip?: string): boolean {
  const clientIP = ip || getClientIP()
  const now = Date.now()

  const entry = ipStore.get(clientIP)

  if (!entry) {
    return false
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return true
  }

  // Reset if window has passed
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    ipStore.delete(clientIP)
    return false
  }

  return false
}

export function recordFailedAttempt(ip?: string): boolean {
  const clientIP = ip || getClientIP()
  const now = Date.now()

  const entry = ipStore.get(clientIP)

  if (!entry) {
    ipStore.set(clientIP, {
      attempts: 1,
      firstAttempt: now,
      blockedUntil: null,
    })
    return false
  }

  // Reset if window has passed
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    ipStore.set(clientIP, {
      attempts: 1,
      firstAttempt: now,
      blockedUntil: null,
    })
    return false
  }

  entry.attempts++

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION
    return true
  }

  return false
}

export function resetRateLimit(ip?: string): void {
  const clientIP = ip || getClientIP()
  ipStore.delete(clientIP)
}

export function getRateLimitStatus(ip?: string): { attempts: number; blocked: boolean; remainingAttempts: number } {
  const clientIP = ip || getClientIP()
  const now = Date.now()

  const entry = ipStore.get(clientIP)

  if (!entry) {
    return { attempts: 0, blocked: false, remainingAttempts: MAX_ATTEMPTS }
  }

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { attempts: entry.attempts, blocked: true, remainingAttempts: 0 }
  }

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    return { attempts: 0, blocked: false, remainingAttempts: MAX_ATTEMPTS }
  }

  return {
    attempts: entry.attempts,
    blocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.attempts),
  }
}

// For testing - clear all rate limits
export function clearAllRateLimits(): void {
  ipStore.clear()
}
