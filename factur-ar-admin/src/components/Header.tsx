'use client'

import { ThemeToggle } from './ui/ThemeToggle'
import { Button } from './ui/button'

interface HeaderProps {
  title: string
  subtitle: string
  userEmail: string
  onLogout: () => void
}

export function Header({ title, subtitle, userEmail, onLogout }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-[var(--color-primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a4 4 0 11-8 0 4 4 0 018 0zM17 20h-1" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{title}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-muted)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-sm font-medium text-[var(--color-primary-foreground)]">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-[var(--color-foreground)] max-w-[150px] truncate">
            {userEmail}
          </span>
        </div>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:border-[var(--color-destructive)]"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar
        </Button>
      </div>
    </header>
  )
}