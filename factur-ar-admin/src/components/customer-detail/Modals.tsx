import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/Modal'
import { DetailModal } from './DetailModal'
import { FormField, inputClass } from './FormFields'

const registerPaymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  method: z.string().min(1, 'Seleccioná un método'),
  reference: z.string().optional(),
  date: z.string().min(1, 'La fecha es requerida'),
})

const changePlanSchema = z.object({ planId: z.enum(['base', 'pro', 'enterprise'], { message: 'Seleccioná un plan' }) })

const registerPOSSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  puntoVenta: z.coerce.number().int().positive('El número de punto de venta debe ser mayor a 0'),
})

type RegisterPaymentForm = z.infer<typeof registerPaymentSchema>
type ChangePlanForm = z.infer<typeof changePlanSchema>
type RegisterPOSForm = z.infer<typeof registerPOSSchema>

import { PLANS } from './data'
import { cn } from '../../lib/utils'

interface RegisterPaymentModalProps { open: boolean; onClose: () => void }
export function RegisterPaymentModal({ open, onClose }: RegisterPaymentModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterPaymentForm>({ resolver: zodResolver(registerPaymentSchema), defaultValues: { date: new Date().toISOString().split('T')[0] } })
  return (
    <DetailModal open={open} title="Registrar Pago" onClose={onClose} accentColor="emerald">
      <form onSubmit={handleSubmit(() => { reset(); onClose() })} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Monto ($)" error={errors.amount?.message}><input type="number" step="0.01" placeholder="0.00" className={inputClass} {...register('amount')} /></FormField>
          <FormField label="Fecha" error={errors.date?.message}><input type="date" className={inputClass} {...register('date')} /></FormField>
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
        <FormField label="Referencia (opcional)" error={errors.reference?.message}><input type="text" placeholder="N° de comprobante..." className={inputClass} {...register('reference')} /></FormField>
        <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" className="flex-1">Registrar</Button></div>
      </form>
    </DetailModal>
  )
}

interface ChangePlanModalProps { open: boolean; onClose: () => void }
export function ChangePlanModal({ open, onClose }: ChangePlanModalProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePlanForm>({ resolver: zodResolver(changePlanSchema), defaultValues: { planId: 'pro' } })
  const selectedPlanId = watch('planId') ?? 'pro'
  return (
    <DetailModal open={open} title="Actualizar Plan" onClose={onClose} accentColor="indigo">
      <form onSubmit={handleSubmit(() => onClose())} className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">Seleccioná el nuevo plan para este cliente.</p>
        <div className="grid grid-cols-1 gap-3">
          {Object.values(PLANS).map((plan) => {
            const isSelected = selectedPlanId === plan.id
            return (
              <label key={plan.id} className={cn('relative flex flex-col gap-3 p-4 rounded-xl border transition-colors cursor-pointer', isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/60')}>
                <input type="radio" value={plan.id} {...register('planId')} className="sr-only" />
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[var(--color-foreground)]">{plan.name}</span><span className="text-sm font-bold text-[var(--color-primary)]">${plan.price.toLocaleString('es-AR')}/mes</span></div>
                <ul className="space-y-1 text-xs text-[var(--color-muted-foreground)]">{plan.features.slice(0, 3).map((f) => <li key={f} className="flex items-center gap-2"><svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{f}</li>)}</ul>
                {isSelected && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Seleccionado</span>}
              </label>
            )
          })}
        </div>
        {errors.planId && <p className="text-xs text-[var(--color-destructive)]">{errors.planId.message}</p>}
        <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" className="flex-1">Confirmar</Button></div>
      </form>
    </DetailModal>
  )
}

interface RegisterPOSModalProps { open: boolean; onClose: () => void }
export function RegisterPOSModal({ open, onClose }: RegisterPOSModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterPOSForm>({ resolver: zodResolver(registerPOSSchema) })
  return (
    <DetailModal open={open} title="Registrar Punto de Venta" onClose={onClose} accentColor="amber">
      <form onSubmit={handleSubmit(() => { reset(); onClose() })} className="space-y-4">
        <FormField label="Nombre del POS" error={errors.name?.message}><input type="text" placeholder="Ej: Casa Central" className={inputClass} {...register('name')} /></FormField>
        <FormField label="Dirección" error={errors.address?.message}><input type="text" placeholder="Av. Corrientes 1234, CABA" className={inputClass} {...register('address')} /></FormField>
        <FormField label="Número de punto de venta" error={errors.puntoVenta?.message}><input type="number" min="1" step="1" placeholder="1" className={inputClass} {...register('puntoVenta')} /></FormField>
        <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button><Button type="submit" className="flex-1">Registrar</Button></div>
      </form>
    </DetailModal>
  )
}

interface DeactivateModalProps { open: boolean; onClose: () => void; onConfirm: () => void; customerName: string }
export function DeactivateModal({ open, onClose, onConfirm, customerName }: DeactivateModalProps) {
  return (
    <Modal open={open} title="Dar de Baja" onCancel={onClose} onConfirm={onConfirm} confirmText="Dar de Baja" cancelText="Cancelar" variant="danger">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-sm text-red-700 dark:text-red-400">Esta acción desactivará al cliente <strong>{customerName}</strong>. Podrás reactivarlo desde el formulario de edición.</p>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">Confirma que deseás dar de baja al cliente antes de continuar.</p>
      </div>
    </Modal>
  )
}