import { Button } from '../../components/ui/button'
import { PLANS, mockPlanHistory } from './data'
import { cn } from '../../lib/utils'

interface PlanTabProps {
  onChangePlan: () => void
}

export function PlanTab({ onChangePlan }: PlanTabProps) {
  const currentPlan = PLANS.pro

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-xl border-2 border-[var(--color-primary)]/40 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Plan Actual</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">Activo</span>
            </div>
            <h3 className="text-xl font-bold text-[var(--color-foreground)]">{currentPlan.name}</h3>
            <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">${currentPlan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-[var(--color-muted-foreground)]">/mes</span></p>
          </div>
          <Button size="sm" variant="outline" onClick={onChangePlan}>Cambiar Plan</Button>
        </div>
        <ul className="mt-4 space-y-1.5">
          {currentPlan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <svg className="w-4 h-4 text-[var(--color-primary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(PLANS).map((plan) => (
          <div key={plan.id} className={cn('rounded-xl border p-4 transition-colors', plan.id === currentPlan.id ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-border)]/80')}>
            <p className="font-semibold text-sm text-[var(--color-foreground)]">{plan.name}</p>
            <p className="text-lg font-bold text-[var(--color-primary)] mt-0.5">${plan.price.toLocaleString('es-AR')}<span className="text-xs font-normal text-[var(--color-muted-foreground)]">/mes</span></p>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Historial de cambios</h4>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]/50">
          {mockPlanHistory.map((change) => (
            <div key={change.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div><span className="text-[var(--color-muted-foreground)]">{change.fromPlan}</span><svg className="inline w-4 h-4 mx-2 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg><span className="font-medium text-[var(--color-foreground)]">{change.toPlan}</span></div>
              <div className="text-right"><p className="text-xs text-[var(--color-muted-foreground)]">{new Date(change.date).toLocaleDateString('es-AR')}</p><p className="text-xs text-[var(--color-muted-foreground)]/70">{change.changedBy}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}