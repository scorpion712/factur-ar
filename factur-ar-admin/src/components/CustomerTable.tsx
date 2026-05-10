import { Link, useNavigate } from 'react-router-dom'
import { Customer, CONDICION_IVA_OPTIONS } from '../types/customer'
import { cn } from '../lib/utils'

interface CustomerTableProps {
  customers: Customer[]
  onDelete: (id: string) => void
}

function getCondicionIvaLabel(value: string) {
  const option = CONDICION_IVA_OPTIONS.find((o) => o.value === value)
  return option ? option.label : value
}

// Enhanced Badge Component
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-gray-400')} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function PaymentBadge({ valid }: { valid: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        valid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
      )}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {valid ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
      {valid ? 'Válido' : 'Pendiente'}
    </span>
  )
}

// Action Button with Tooltip
function ActionButton({ onClick, icon, label, variant = 'default' }: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'destructive'
}) {
  const baseStyles = 'p-2 rounded-lg transition-all duration-200 hover:scale-105'
  const variantStyles = variant === 'destructive'
    ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50'
    : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variantStyles)}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

export function CustomerTable({ customers, onDelete }: CustomerTableProps) {
  const navigate = useNavigate()

  if (customers.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-[var(--color-muted)]/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-muted-foreground)] font-medium">No hay clientes</p>
            <p className="text-sm text-[var(--color-muted-foreground)]/70 mt-1">Crea tu primer cliente para comenzar</p>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      {customers.map((customer, index) => (
        <tr
          key={customer.id}
          className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-muted)]/30 transition-colors duration-200 group cursor-pointer"
          style={{ animationDelay: `${index * 30}ms` }}
          onClick={() => navigate(`/customer/${customer.id}/detail`)}
        >
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                {customer.razonSocial.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-[var(--color-foreground)]">{customer.razonSocial}</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <code className="px-2 py-1 rounded-md bg-[var(--color-muted)]/50 text-sm font-mono text-[var(--color-muted-foreground)]">
              {customer.CUIT}
            </code>
          </td>
          <td className="px-6 py-4 text-sm text-[var(--color-muted-foreground)]">
            {customer.puntoVenta.toString().padStart(4, '0')}
          </td>
          <td className="px-6 py-4 text-sm text-[var(--color-muted-foreground)]">
            {getCondicionIvaLabel(customer.condicionIva)}
          </td>
          <td className="px-6 py-4">
            <StatusBadge active={customer.active} />
          </td>
          <td className="px-6 py-4">
            <PaymentBadge valid={customer.paymentValid} />
          </td>
          <td className="px-6 py-4">
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Link to={`/customer/${customer.id}`}>
                <ActionButton
                  onClick={() => {}}
                  label="Editar cliente"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />
              </Link>
              <ActionButton
                onClick={() => onDelete(customer.id)}
                label="Eliminar cliente"
                variant="destructive"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}