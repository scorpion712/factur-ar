import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/auth'
import { useCustomerStore } from '../store/customers'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import type { Customer, Payment, Plan, PlanChange, PointOfSale } from '../types/customer'

// ─── Mock data ─────────────────────────────────────────────────────────────────

function getMockPayments(): Payment[] {
  return [
    { id: '1', date: '2026-05-01', amount: 4500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260501' },
    { id: '2', date: '2026-04-01', amount: 4500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260401' },
    { id: '3', date: '2026-03-01', amount: 4500, status: 'paid', method: 'Efectivo' },
    { id: '4', date: '2026-02-01', amount: 3500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260201' },
    { id: '5', date: '2026-01-01', amount: 3500, status: 'overdue', method: 'Pendiente' },
  ]
}

const PLANS: Record<string, Plan> = {
  base: {
    id: 'base',
    name: 'Plan Base',
    price: 3500,
    features: ['Hasta 500 facturas/mes', '1 Punto de Venta', 'Soporte email'],
  },
  pro: {
    id: 'pro',
    name: 'Plan Pro',
    price: 4500,
    features: ['Hasta 2000 facturas/mes', '3 Puntos de Venta', 'Soporte prioritario', 'API access'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise',
    price: 8500,
    features: ['Facturas ilimitadas', 'Puntos de Venta ilimitados', 'Soporte 24/7', 'API access', 'SLA 99.9%'],
  },
}

function getMockPlanHistory(): PlanChange[] {
  return [
    { id: '1', date: '2026-02-01', fromPlan: 'Plan Base', toPlan: 'Plan Pro', changedBy: 'admin@facturar.ar' },
    { id: '2', date: '2025-10-15', fromPlan: 'Gratuito', toPlan: 'Plan Base', changedBy: 'admin@facturar.ar' },
  ]
}

function getMockPOS(): PointOfSale[] {
  return [
    { id: '1', name: 'Casa Central', address: 'Av. Corrientes 1234, CABA', status: 'active', createdAt: '2025-10-15' },
    { id: '2', name: 'Sucursal Norte', address: 'Cabildo 4567, CABA', status: 'active', createdAt: '2026-01-10' },
  ]
}

// ─── Zod schemas ───────────────────────────────────────────────────────────────

const registerPaymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  method: z.string().min(1, 'Seleccioná un método'),
  reference: z.string().optional(),
  date: z.string().min(1, 'La fecha es requerida'),
})

const changePlanSchema = z.object({
  planId: z.enum(['base', 'pro', 'enterprise'], { message: 'Seleccioná un plan' }),
})

const registerPOSSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
})

type RegisterPaymentForm = z.infer<typeof registerPaymentSchema>
type ChangePlanForm = z.infer<typeof changePlanSchema>
type RegisterPOSForm = z.infer<typeof registerPOSSchema>

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'summary' | 'payments' | 'plan' | 'pos'

// ─── Sub-components ────────────────────────────────────────────────────────────

function DetailModal({
  open,
  title,
  onClose,
  children,
  accentColor = 'indigo',
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'red'
}) {
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

  const gradients: Record<string, string> = {
    indigo: 'from-[var(--color-primary)] to-[var(--color-secondary)]',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', gradients[accentColor])} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
      active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-gray-400')} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    overdue: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  }
  const labels = { paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', styles[status])}>
      {labels[status]}
    </span>
  )
}

function POSStatusBadge({ status }: { status: PointOfSale['status'] }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
      status === 'active'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/40 focus:border-[var(--color-ring)] transition-colors'

// ─── Tab components ────────────────────────────────────────────────────────────

function SummaryTab({ customer }: { customer: Customer }) {
  const condicionLabels: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
    MONOTRIBUTISTA: 'Monotributista',
    EXENTO: 'Exento',
    CONSUMIDOR_FINAL: 'Consumidor Final',
  }

  const payments = getMockPayments()
  const lastPaid = payments.find((p) => p.status === 'paid')

  const fields = [
    { label: 'Razón Social', value: customer.razonSocial },
    { label: 'CUIT', value: customer.CUIT, mono: true },
    { label: 'Punto de Venta', value: String(customer.puntoVenta).padStart(4, '0'), mono: true },
    { label: 'Condición IVA', value: condicionLabels[customer.condicionIva] ?? customer.condicionIva },
    { label: 'Último Pago', value: lastPaid ? new Date(lastPaid.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin registros' },
    { label: 'Plan Actual', value: 'Plan Pro' },
    { label: 'Alta', value: new Date(customer.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) },
    { label: 'Última modificación', value: new Date(customer.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {fields.map(({ label, value, mono }) => (
        <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/30 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">{label}</p>
          {mono ? (
            <code className="text-sm font-mono text-[var(--color-foreground)] bg-[var(--color-muted)]/60 px-2 py-0.5 rounded">{value}</code>
          ) : (
            <p className="text-sm font-medium text-[var(--color-foreground)]">{value}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function PaymentsTab() {
  const payments = getMockPayments()

  const total = payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0)
  const pending = payments.filter((p) => p.status !== 'paid').length

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{payments.length}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Total pagos</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">${total.toLocaleString('es-AR')}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Cobrado</p>
        </div>
        <div className={cn('rounded-xl border p-4 text-center', pending > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-[var(--color-border)] bg-[var(--color-card)]')}>
          <p className={cn('text-2xl font-bold', pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-foreground)]')}>{pending}</p>
          <p className={cn('text-xs mt-0.5', pending > 0 ? 'text-amber-500' : 'text-[var(--color-muted-foreground)]')}>Pendientes</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Método</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Referencia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, i) => (
              <tr key={payment.id} className={cn('border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/20 transition-colors', i === payments.length - 1 && 'border-0')}>
                <td className="px-4 py-3 text-sm text-[var(--color-foreground)]">
                  {new Date(payment.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[var(--color-foreground)]">
                  ${payment.amount.toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">{payment.method}</td>
                <td className="px-4 py-3">
                  {payment.reference ? (
                    <code className="text-xs font-mono text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/60 px-1.5 py-0.5 rounded">{payment.reference}</code>
                  ) : (
                    <span className="text-xs text-[var(--color-muted-foreground)]/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlanTab({ onChangePlan }: { onChangePlan: () => void }) {
  const currentPlan = PLANS.pro
  const history = getMockPlanHistory()

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Current plan */}
      <div className="rounded-xl border-2 border-[var(--color-primary)]/40 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Plan Actual</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">Activo</span>
            </div>
            <h3 className="text-xl font-bold text-[var(--color-foreground)]">{currentPlan.name}</h3>
            <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
              ${currentPlan.price.toLocaleString('es-AR')}
              <span className="text-sm font-normal text-[var(--color-muted-foreground)]">/mes</span>
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onChangePlan}>
            Cambiar Plan
          </Button>
        </div>
        <ul className="mt-4 space-y-1.5">
          {currentPlan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <svg className="w-4 h-4 text-[var(--color-primary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* All plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(PLANS).map((plan) => (
          <div key={plan.id} className={cn(
            'rounded-xl border p-4 transition-colors',
            plan.id === currentPlan.id
              ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-border)]/80'
          )}>
            <p className="font-semibold text-sm text-[var(--color-foreground)]">{plan.name}</p>
            <p className="text-lg font-bold text-[var(--color-primary)] mt-0.5">
              ${plan.price.toLocaleString('es-AR')}<span className="text-xs font-normal text-[var(--color-muted-foreground)]">/mes</span>
            </p>
          </div>
        ))}
      </div>

      {/* History */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Historial de cambios</h4>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]/50">
          {history.map((change) => (
            <div key={change.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="text-[var(--color-muted-foreground)]">{change.fromPlan}</span>
                <svg className="inline w-4 h-4 mx-2 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="font-medium text-[var(--color-foreground)]">{change.toPlan}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-muted-foreground)]">{new Date(change.date).toLocaleDateString('es-AR')}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]/70">{change.changedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function POSTab({
  posList,
  onRegisterPOS,
}: {
  posList: PointOfSale[]
  onRegisterPOS: () => void
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {posList.length} punto{posList.length !== 1 ? 's' : ''} de venta registrado{posList.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={onRegisterPOS}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar POS
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Dirección</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Alta</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {posList.map((pos, i) => (
              <tr key={pos.id} className={cn('border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/20 transition-colors', i === posList.length - 1 && 'border-0')}>
                <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">{pos.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">{pos.address}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  {new Date(pos.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <POSStatusBadge status={pos.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Modals ────────────────────────────────────────────────────────────────────

function RegisterPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterPaymentForm>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  const onSubmit = (_data: RegisterPaymentForm) => {
    // TODO: persist to store/service
    reset()
    onClose()
  }

  return (
    <DetailModal open={open} title="Registrar Pago" onClose={onClose} accentColor="emerald">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Monto ($)" error={errors.amount?.message}>
            <input type="number" step="0.01" placeholder="0.00" className={inputClass} {...register('amount')} />
          </FormField>
          <FormField label="Fecha" error={errors.date?.message}>
            <input type="date" className={inputClass} {...register('date')} />
          </FormField>
        </div>
        <FormField label="Método de pago" error={errors.method?.message}>
          <select className={inputClass} {...register('method')}>
            <option value="">Seleccioná...</option>
            <option value="Transferencia">Transferencia bancaria</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
            <option value="Otro">Otro</option>
          </select>
        </FormField>
        <FormField label="Referencia (opcional)" error={errors.reference?.message}>
          <input type="text" placeholder="N° de comprobante..." className={inputClass} {...register('reference')} />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1">Registrar</Button>
        </div>
      </form>
    </DetailModal>
  )
}

function ChangePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ChangePlanForm>({
    resolver: zodResolver(changePlanSchema),
  })

  const onSubmit = (_data: ChangePlanForm) => {
    // TODO: persist to store/service
    onClose()
  }

  return (
    <DetailModal open={open} title="Actualizar Plan" onClose={onClose} accentColor="indigo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">Seleccioná el nuevo plan para este cliente.</p>
        <div className="space-y-2">
          {Object.values(PLANS).map((plan) => (
            <label key={plan.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40 transition-colors cursor-pointer has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary)]/5">
              <input type="radio" value={plan.id} {...register('planId')} className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">{plan.name}</span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">${plan.price.toLocaleString('es-AR')}/mes</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{plan.features[0]}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.planId && <p className="text-xs text-[var(--color-destructive)]">{errors.planId.message}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1">Confirmar</Button>
        </div>
      </form>
    </DetailModal>
  )
}

function RegisterPOSModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterPOSForm>({
    resolver: zodResolver(registerPOSSchema),
  })

  const onSubmit = (_data: RegisterPOSForm) => {
    // TODO: persist to store/service
    reset()
    onClose()
  }

  return (
    <DetailModal open={open} title="Registrar Punto de Venta" onClose={onClose} accentColor="amber">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre del POS" error={errors.name?.message}>
          <input type="text" placeholder="Ej: Casa Central" className={inputClass} {...register('name')} />
        </FormField>
        <FormField label="Dirección" error={errors.address?.message}>
          <input type="text" placeholder="Av. Corrientes 1234, CABA" className={inputClass} {...register('address')} />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1">Registrar</Button>
        </div>
      </form>
    </DetailModal>
  )
}

function DeactivateModal({ open, onClose, onConfirm, customerName }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  customerName: string
}) {
  return (
    <DetailModal open={open} title="Dar de Baja" onClose={onClose} accentColor="red">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">
            Esta acción desactivará al cliente <strong>{customerName}</strong>. Podrás reactivarlo desde el formulario de edición.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm}>Dar de Baja</Button>
        </div>
      </div>
    </DetailModal>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { getCustomerById, deleteCustomer } = useCustomerStore()

  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [posList] = useState<PointOfSale[]>(getMockPOS())

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [posModalOpen, setPOSModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  const customer = id ? getCustomerById(id) : undefined

  // Redirect if not found
  useEffect(() => {
    if (id && !customer) navigate('/', { replace: true })
  }, [id, customer, navigate])

  if (!customer) return null

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'summary',
      label: 'Resumen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: 'payments',
      label: 'Pagos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      key: 'pos',
      label: 'Puntos de Venta',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ]

  const handleDeactivate = async () => {
    if (!user?.idToken) return
    setDeactivateLoading(true)
    try {
      await deleteCustomer(customer.id, user.idToken)
      navigate('/')
    } catch {
      // error handled by store
    } finally {
      setDeactivateLoading(false)
      setDeactivateModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al listado
        </button>

        {/* Header card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up">
          {/* Gradient strip */}
          <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]" />

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--color-primary)]/20">
                  {customer.razonSocial.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--color-card)]',
                  customer.active ? 'bg-emerald-500' : 'bg-gray-400'
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{customer.razonSocial}</h1>
                  <StatusBadge active={customer.active} />
                  {customer.paymentValid && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pago vigente
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    CUIT <code className="font-mono text-[var(--color-foreground)]">{customer.CUIT}</code>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    POS <code className="font-mono text-[var(--color-foreground)]">{String(customer.puntoVenta).padStart(4, '0')}</code>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Plan Pro
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => navigate(`/customer/${customer.id}`)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPlanModalOpen(true)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Actualizar Plan
                </Button>
                <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Registrar Pago
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPOSModalOpen(true)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Registrar POS
                </Button>
                {customer.active && (
                  <Button size="sm" variant="destructive" onClick={() => setDeactivateModalOpen(true)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Dar de Baja
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up delay-100">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
                  activeTab === tab.key
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border)]'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'summary' && <SummaryTab customer={customer} />}
            {activeTab === 'payments' && <PaymentsTab />}
            {activeTab === 'plan' && <PlanTab onChangePlan={() => setPlanModalOpen(true)} />}
            {activeTab === 'pos' && <POSTab posList={posList} onRegisterPOS={() => setPOSModalOpen(true)} />}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RegisterPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <ChangePlanModal open={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      <RegisterPOSModal open={posModalOpen} onClose={() => setPOSModalOpen(false)} />
      <DeactivateModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        customerName={customer.razonSocial}
      />
      {deactivateLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-[var(--color-card)] rounded-xl px-6 py-4 shadow-xl border border-[var(--color-border)]">
            <svg className="animate-spin h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">Procesando...</span>
          </div>
        </div>
      )}
    </div>
  )
}
