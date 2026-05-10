import type { ReactNode } from 'react'

export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  )
}

export const inputClass = 'w-full px-3 py-2 rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/40 focus:border-[var(--color-ring)] transition-colors'