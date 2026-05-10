import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'
import { useAuthStore } from './store/auth'
import { useSessionTimeout } from './hooks/use-session-timeout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerForm from './pages/CustomerForm'

// ─── Auth listener (inicializa la suscripción de Firebase / mock) ──────────────

function AuthBootstrap() {
  const initAuthListener = useAuthStore((s) => s.initAuthListener)

  useEffect(() => {
    const unsubscribe = initAuthListener()
    return unsubscribe
  }, [initAuthListener])

  return null
}

// ─── Session timeout ───────────────────────────────────────────────────────────

function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useSessionTimeout({
    onTimeout: () => {
      logout()
      navigate('/login')
    },
    enabled: isAuthenticated,
  })

  return <>{children}</>
}

// ─── Rutas protegidas ──────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthBootstrap />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SessionTimeoutWrapper>
                  <Dashboard />
                </SessionTimeoutWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/new"
            element={
              <ProtectedRoute>
                <SessionTimeoutWrapper>
                  <CustomerForm />
                </SessionTimeoutWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/:id"
            element={
              <ProtectedRoute>
                <SessionTimeoutWrapper>
                  <CustomerForm />
                </SessionTimeoutWrapper>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
