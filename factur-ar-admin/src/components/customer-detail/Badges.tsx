import { cn } from '../../lib/utils'

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border', active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-gray-400')} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

type PaymentStatus = 'paid' | 'pending' | 'overdue'

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    overdue: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  }
  const labels: Record<PaymentStatus, string> = { paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido' }
  return <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', styles[status])}>{labels[status]}</span>
}

type POSStatus = 'active' | 'inactive'

export function POSStatusBadge({ status }: { status: POSStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
  )
}