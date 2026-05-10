import { Button } from '../../components/ui/button'
import { POSStatusBadge } from './Badges'
import type { PointOfSale } from '../../types/customer'
import { cn } from '../../lib/utils'

interface POSTabProps {
  posList: PointOfSale[]
  onRegisterPOS: () => void
}

export function POSTab({ posList, onRegisterPOS }: POSTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">{posList.length} punto{posList.length !== 1 ? 's' : ''} de venta registrado{posList.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={onRegisterPOS}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Registrar POS
        </Button>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Dirección</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Alta</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Estado</th>
          </tr></thead>
          <tbody>
            {posList.map((pos, i) => (
              <tr key={pos.id} className={cn('border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/20 transition-colors', i === posList.length - 1 && 'border-0')}>
                <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">{pos.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">{pos.address}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">{new Date(pos.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3"><POSStatusBadge status={pos.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}