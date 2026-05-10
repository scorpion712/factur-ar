import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { loginSchema } from '../lib/auth/schemas'
import { isRateLimited, recordFailedAttempt, getRateLimitStatus } from '../lib/auth/rate-limiter'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (isRateLimited()) {
      setErrors({ general: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' })
      return
    }

    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const first = validation.error.errors[0]
      if (first.path[0] === 'email') setErrors({ email: first.message })
      else setErrors({ password: first.message })
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      const blocked = recordFailedAttempt()
      const status = getRateLimitStatus()
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setErrors({
        general: blocked
          ? 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
          : `${message}. Intentos restantes: ${status.remainingAttempts}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (pwd: string) => {
    const checks = [
      pwd.length >= 12 && pwd.length <= 128,
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ]
    return checks.filter(Boolean).length
  }

  const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981']
  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh bg-dots p-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float delay-200" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-xl shadow-[var(--color-primary)]/20 mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gradient font-display">FacturAr</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2 text-lg">Administración de Clientes</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-xl shadow-black/5 border border-[var(--color-border)] overflow-hidden animate-fade-in-up delay-200">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Bienvenido de nuevo</h2>
            <p className="text-[var(--color-muted-foreground)] mb-6">Ingresá tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@facturar.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[var(--color-muted)]/30 border-transparent focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                />
                {errors.email && (
                  <p className="text-sm text-[var(--color-destructive)]">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-20 bg-[var(--color-muted)]/30 border-transparent focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-[var(--color-destructive)]">{errors.password}</p>
                )}
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--color-muted)]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Fortaleza</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: strengthColors[getPasswordStrength(password) - 1] ?? '#6B7280' }}
                    >
                      {strengthLabels[getPasswordStrength(password) - 1] ?? 'Muy débil'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            getPasswordStrength(password) > i
                              ? strengthColors[getPasswordStrength(password) - 1]
                              : 'var(--color-border)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      [password.length >= 12, '12+ caracteres'],
                      [/[A-Z]/.test(password), 'Mayúscula'],
                      [/[a-z]/.test(password), 'Minúscula'],
                      [/[0-9]/.test(password), 'Número'],
                    ].map(([met, label]) => (
                      <span
                        key={label as string}
                        className={met ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted-foreground)]'}
                      >
                        ✓ {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error general */}
              {errors.general && (
                <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20">
                  <p className="text-sm text-[var(--color-destructive)] text-center">{errors.general}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </div>

          {/* Footer hint */}
          <div className="px-8 py-4 bg-[var(--color-muted)]/30 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Demo: admin@facturar.com / Admin@12345678</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-muted-foreground)] mt-8">© 2026 FacturAr</p>
      </div>
    </div>
  )
}
