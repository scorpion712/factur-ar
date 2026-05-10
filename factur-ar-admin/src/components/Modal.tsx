import { useEffect } from 'react'
import { Button } from './ui/button'

interface ModalProps {
  open: boolean
  title: string
  children: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

export function Modal({
  open,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3
            id="modal-title"
            className="text-lg font-semibold text-center text-[var(--color-foreground)] mb-2"
          >
            {title}
          </h3>

          {/* Content */}
          <div className="text-sm text-center text-[var(--color-muted-foreground)] leading-relaxed">
            {children}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 bg-[var(--color-muted)]/30 border-t border-[var(--color-border)]">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="flex-1 h-11"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}