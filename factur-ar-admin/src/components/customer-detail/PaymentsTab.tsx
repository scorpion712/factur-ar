import { Button } from '../../components/ui/button'
import { PaymentStatusBadge } from './Badges'
import { mockPayments } from './data'
import { cn } from '../../lib/utils'

interface PaymentsTabProps {
  onRegisterPayment: () => void
}

export function PaymentsTab({ onRegisterPayment }: PaymentsTabProps) {
  const total = mockPayments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0)
  const pending = mockPayments.filter((p) => p.status !== 'paid').length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{mockPayments.length}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Pagos registrados</p>
          <p className="text-sm font-medium text-[var(--color-muted-foreground)] mt-2">Total ${total.toLocaleString('es-AR')}</p>
        </div>
        <div className={cn('rounded-xl border p-4 relative', pending > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-[var(--color-border)] bg-[var(--color-card)]')}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-muted-foreground)]')}>Pendientes</span>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={onRegisterPayment}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Registrar
            </Button>
          </div>
          <p className={cn('text-3xl font-bold', pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-foreground)]')}>{pending}</p>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Monto</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Método</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Referencia</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Estado</th>
          </tr></thead>
          <tbody>
            {mockPayments.map((p, i) => (
              <tr key={p.id} className={cn('border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/20 transition-colors', i === mockPayments.length - 1 && 'border-0')}>
                <td className="px-4 py-3 text-sm text-[var(--color-foreground)]">{new Date(p.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-sm font-semibold text-[var(--color-foreground)]">${p.amount.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">{p.method}</td>
                <td className="px-4 py-3">{p.reference ? <code className="text-xs font-mono text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/60 px-1.5 py-0.5 rounded">{p.reference}</code> : <span className="text-xs text-[var(--color-muted-foreground)]/50">—</span>}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}