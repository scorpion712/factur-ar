import { Button } from './ui/button'

interface FormActionsProps {
  onCancel: () => void
  onSubmit: () => void
  submitText: string
  loading: boolean
}

export function FormActions({ onCancel, onSubmit, submitText, loading }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={loading} onClick={onSubmit}>
        {loading ? 'Guardando...' : submitText}
      </Button>
    </div>
  )
}