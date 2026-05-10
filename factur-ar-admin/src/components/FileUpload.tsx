import { Label } from './ui/label'

interface FileUploadProps {
  label: string
  accept: string
  file: File | null
  onChange: (file: File | null) => void
  error?: string
}

export function FileUpload({ label, accept, file, onChange, error }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="border-2 border-dashed border-[var(--color-border)] rounded-md p-4 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)] transition-colors">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {file ? file.name : 'Arrastra o selecciona un archivo'}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
    </div>
  )
}