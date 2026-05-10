import { cn } from '../lib/utils'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'neutral'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  success: 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
  warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  error: 'bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]',
  neutral: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}