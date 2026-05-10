import { useEffect, type ReactNode } from 'react'

interface DetailModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'red'
}

const gradients: Record<string, string> = {
  indigo: 'from-[var(--color-primary)] to-[var(--color-secondary)]',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-rose-500',
}

export function DetailModal({ open, title, onClose, children, accentColor = 'indigo' }: DetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} role="dialog" aria-modal="true">
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '32rem', maxHeight: '85vh', overflow: 'auto', backgroundColor: 'var(--color-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: gradients[accentColor] }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{title}</h3>
          <button onClick={onClose} style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}