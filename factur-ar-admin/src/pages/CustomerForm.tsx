import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useCustomerStore } from '../store/customers'
import type { CondicionIva } from '../types/customer'
import { CustomerFormFields } from '../components/CustomerFormFields'

// ─── Tipos locales del form ────────────────────────────────────────────────────

interface FormData {
  razonSocial: string
  CUIT: string
  puntoVenta: string
  condicionIva: CondicionIva
  accessToken: string
  certificate: File | null
  privateKey: File | null
  active: boolean
  paymentValid: boolean
}

type FormErrors = Partial<Record<keyof FormData, string>>

const INITIAL_FORM: FormData = {
  razonSocial: '',
  CUIT: '',
  puntoVenta: '',
  condicionIva: 'RESPONSABLE_INSCRIPTO',
  accessToken: '',
  certificate: null,
  privateKey: null,
  active: true,
  paymentValid: false,
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function CustomerForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const user = useAuthStore((s) => s.user)
  const { addCustomer, updateCustomer, getCustomerById } = useCustomerStore()

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Carga datos del cliente cuando es edición
  useEffect(() => {
    if (isEdit && id) {
      const customer = getCustomerById(id)
      if (customer) {
        setFormData({
          razonSocial: customer.razonSocial,
          CUIT: customer.CUIT,
          puntoVenta: String(customer.puntoVenta),
          condicionIva: customer.condicionIva as CondicionIva,
          accessToken: customer.accessToken,
          certificate: null,
          privateKey: null,
          active: customer.active,
          paymentValid: customer.paymentValid,
        })
      }
    }
  }, [isEdit, id, getCustomerById])

  // ── Validación ────────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.razonSocial.trim()) newErrors.razonSocial = 'La razón social es requerida'
    if (!formData.CUIT.trim()) newErrors.CUIT = 'El CUIT es requerido'
    else if (!/^\d{11}$/.test(formData.CUIT)) newErrors.CUIT = 'El CUIT debe tener 11 dígitos'
    if (!formData.puntoVenta) newErrors.puntoVenta = 'El punto de venta es requerido'
    else if (!/^\d{1,4}$/.test(formData.puntoVenta)) newErrors.puntoVenta = 'Debe ser 1-4 dígitos'
    if (!formData.accessToken.trim()) newErrors.accessToken = 'El token es requerido'
    if (!isEdit && !formData.certificate) newErrors.certificate = 'El certificado es requerido'
    if (!isEdit && !formData.privateKey) newErrors.privateKey = 'La clave privada es requerida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user?.idToken) return

    setSaving(true)
    setSaveError(null)

    try {
      if (isEdit && id) {
        await updateCustomer(
          id,
          {
            razonSocial: formData.razonSocial,
            puntoVenta: Number(formData.puntoVenta),
            condicionIva: formData.condicionIva,
            accessToken: formData.accessToken,
            active: formData.active,
            paymentValid: formData.paymentValid,
            certificate: formData.certificate ? toFileList(formData.certificate) : undefined,
            privateKey: formData.privateKey ? toFileList(formData.privateKey) : undefined,
          },
          user.idToken,
        )
      } else {
        await addCustomer(
          {
            razonSocial: formData.razonSocial,
            CUIT: formData.CUIT,
            puntoVenta: Number(formData.puntoVenta),
            condicionIva: formData.condicionIva,
            accessToken: formData.accessToken,
            active: formData.active,
            paymentValid: formData.paymentValid,
            certificate: formData.certificate ? toFileList(formData.certificate) : undefined,
            privateKey: formData.privateKey ? toFileList(formData.privateKey) : undefined,
          },
          user.idToken,
        )
      }
      navigate('/')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el cliente')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-mesh bg-dots">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al listado
        </button>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up">
          <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {isEdit ? 'Actualizá los datos del cliente' : 'Completá los datos del nuevo cliente'}
            </p>
          </div>

          <div className="p-6">
            {saveError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20">
                <p className="text-sm text-[var(--color-destructive)]">{saveError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <CustomerFormFields
                formData={formData}
                errors={errors}
                isEdit={isEdit}
                saving={saving}
                onFieldChange={updateField}
                onCancel={() => navigate('/')}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * El servicio espera FileList (del input nativo), pero en el form local
 * guardamos File directamente. Este helper adapta un File → FileList-like.
 */
function toFileList(file: File): FileList {
  const dt = new DataTransfer()
  dt.items.add(file)
  return dt.files
}
