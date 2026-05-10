import { useEffect, useRef, useCallback } from 'react'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000 // 5 minutes warning

interface UseSessionTimeoutOptions {
  onTimeout: () => void
  onWarning?: () => void
  enabled?: boolean
}

export function useSessionTimeout({
  onTimeout,
  onWarning,
  enabled = true,
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    if (!enabled) return

    // Set warning timer
    if (onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning()
      }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT)
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout()
    }, SESSION_TIMEOUT)
  }, [enabled, onTimeout, onWarning])

  const handleActivity = useCallback(() => {
    const now = Date.now()
    // Debounce - only reset if at least 1 second since last reset
    if (now - lastActivityRef.current > 1000) {
      resetTimers()
    }
  }, [resetTimers])

  useEffect(() => {
    if (!enabled) return

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Initial timer setup
    resetTimers()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [enabled, handleActivity, resetTimers])
}
