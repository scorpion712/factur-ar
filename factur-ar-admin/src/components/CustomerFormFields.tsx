import { CondicionIva, CONDICION_IVA_OPTIONS } from '../types/customer'
import { TextField, SelectField } from './FormFields'
import { FileUpload } from './FileUpload'
import { Checkbox } from './FormControls'
import { FormActions } from './FormActions'

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

interface Errors {
  razonSocial?: string
  CUIT?: string
  puntoVenta?: string
  accessToken?: string
  certificate?: string
  privateKey?: string
}

interface CustomerFormFieldsProps {
  formData: FormData
  errors: Errors
  isEdit: boolean
  saving: boolean
  onFieldChange: (field: keyof FormData, value: string | boolean | File | null) => void
  onCancel: () => void
}

export function CustomerFormFields({
  formData,
  errors,
  isEdit,
  saving,
  onFieldChange,
  onCancel,
}: CustomerFormFieldsProps) {
  const handleCUITChange = (value: string) =>
    onFieldChange('CUIT', value.replace(/\D/g, '').slice(0, 11))
  const handlePuntoVentaChange = (value: string) =>
    onFieldChange('puntoVenta', value.replace(/\D/g, '').slice(0, 4))

  return (
    <div className="space-y-6">
      {/* Section: Datos del Cliente */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Datos del Cliente
        </h3>
        <div className="grid gap-4">
          <TextField
            label="Razón Social"
            id="razonSocial"
            value={formData.razonSocial}
            onChange={(v) => onFieldChange('razonSocial', v)}
            placeholder="Empresa ABC SA"
            error={errors.razonSocial}
          />
        </div>
      </div>

      {/* Section: Identificación Fiscal */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Identificación Fiscal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="CUIT"
            id="CUIT"
            value={formData.CUIT}
            onChange={handleCUITChange}
            placeholder="30123456789"
            error={errors.CUIT}
            disabled={isEdit}
            maxLength={11}
          />
          <TextField
            label="Punto de Venta"
            id="puntoVenta"
            value={formData.puntoVenta}
            onChange={handlePuntoVentaChange}
            placeholder="0001"
            error={errors.puntoVenta}
            maxLength={4}
          />
        </div>
        <div className="grid gap-4">
          <SelectField
            label="Condición IVA"
            id="condicionIva"
            value={formData.condicionIva}
            onChange={(v) => onFieldChange('condicionIva', v as CondicionIva)}
            options={CONDICION_IVA_OPTIONS}
          />
        </div>
      </div>

      {/* Section: AFIP */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Configuración AFIP
        </h3>
        <div className="grid gap-4">
          <TextField
            label="Token de Acceso AFIP"
            id="accessToken"
            value={formData.accessToken}
            onChange={(v) => onFieldChange('accessToken', v)}
            placeholder="Token de acceso de AFIP"
            error={errors.accessToken}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload
            label="Certificado (.crt)"
            accept=".crt,.cer,.pem"
            file={formData.certificate}
            onChange={(f) => onFieldChange('certificate', f)}
            error={errors.certificate}
          />
          <FileUpload
            label="Clave Privada (.key)"
            accept=".key,.pem"
            file={formData.privateKey}
            onChange={(f) => onFieldChange('privateKey', f)}
            error={errors.privateKey}
          />
        </div>
      </div>

      {/* Section: Estado */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Estado
        </h3>
        <div className="flex flex-wrap gap-6">
          <Checkbox
            label="Cliente activo"
            checked={formData.active}
            onChange={(v) => onFieldChange('active', v)}
          />
          <Checkbox
            label="Pago validado"
            checked={formData.paymentValid}
            onChange={(v) => onFieldChange('paymentValid', v)}
          />
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        onSubmit={() => {}}
        submitText={isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
        loading={saving}
      />
    </div>
  )
}