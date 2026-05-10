import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { CONDICION_IVA_OPTIONS, type CondicionIva } from '../../types/customer'
import { mockPayments } from './data'
import { inputClass } from './FormFields'

const CONDICION_IVA_VALUES = ['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'CONSUMIDOR_FINAL'] as const

const inlineEditSchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  CUIT: z.string().regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos'),
  condicionIva: z.enum(CONDICION_IVA_VALUES, { message: 'Seleccioná una condición' }),
})

type InlineEditForm = z.infer<typeof inlineEditSchema>

const condicionLabels: Record<CondicionIva, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTISTA: 'Monotributista',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor Final',
}

interface SummaryTabProps {
  customer: { razonSocial: string; CUIT: string; puntoVenta: number; condicionIva: string; createdAt: string; updatedAt: string }
}

export function SummaryTab({ customer }: SummaryTabProps) {
  const [editing, setEditing] = useState(false)
  const lastPaid = mockPayments.find((p) => p.status === 'paid')

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<InlineEditForm>({
    resolver: zodResolver(inlineEditSchema),
    defaultValues: { razonSocial: customer.razonSocial, CUIT: customer.CUIT, condicionIva: customer.condicionIva as CondicionIva },
  })

  useEffect(() => { reset({ razonSocial: customer.razonSocial, CUIT: customer.CUIT, condicionIva: customer.condicionIva as CondicionIva }) }, [customer, reset])

  const summaryFields = [
    { label: 'Razón Social', value: customer.razonSocial, editable: true, name: 'razonSocial' as const },
    { label: 'CUIT', value: customer.CUIT, mono: true, editable: true, name: 'CUIT' as const },
    { label: 'Punto de Venta', value: String(customer.puntoVenta).padStart(4, '0'), mono: true },
    { label: 'Condición IVA', value: condicionLabels[customer.condicionIva as CondicionIva] ?? customer.condicionIva, editable: true, name: 'condicionIva' as const, type: 'select' as const },
    { label: 'Último Pago', value: lastPaid ? new Date(lastPaid.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin registros' },
    { label: 'Plan Actual', value: 'Plan Pro' },
    { label: 'Alta', value: new Date(customer.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) },
    { label: 'Última modificación', value: new Date(customer.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Datos generales</h2>
        <div className="flex gap-2">
          {editing ? (
            <><Button size="sm" variant="outline" onClick={() => { reset(); setEditing(false) }}>Cancelar</Button><Button size="sm" onClick={handleSubmit(() => setEditing(false))} disabled={!isDirty}>Guardar</Button></>
          ) : <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryFields.map((field) => {
          const fieldName = field.name as keyof InlineEditForm | undefined
          const errorMessage = fieldName ? errors[fieldName]?.message : undefined
          const isEditable = editing && field.editable && fieldName
          return (
            <div key={field.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">{field.label}</p>{field.editable && editing && <span className="text-[var(--color-muted-foreground)] text-[10px] uppercase tracking-wide">Editable</span>}</div>
              {isEditable && fieldName ? (
                <div className="space-y-2">
                  {field.type === 'select' ? (
                    <select className={inputClass} {...register(fieldName)}>{CONDICION_IVA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  ) : (
                    <input type="text" inputMode={fieldName === 'CUIT' ? 'numeric' : 'text'} className={inputClass} {...register(fieldName)} />
                  )}
                  {errorMessage && <p className="text-xs text-[var(--color-destructive)]">{errorMessage}</p>}
                </div>
              ) : field.mono ? <code className="text-sm font-mono text-[var(--color-foreground)] bg-[var(--color-muted)]/60 px-2 py-0.5 rounded">{field.value}</code> : <p className="text-sm font-medium text-[var(--color-foreground)]">{field.value}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}