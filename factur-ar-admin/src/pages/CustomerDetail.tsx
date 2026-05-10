import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useCustomerStore } from '../store/customers'
import { useCustomerDetailStore } from '../store/customerDetail'
import { Button } from '../components/ui/button'
import { StatusBadge } from '../components/customer-detail/Badges'
import { SummaryTab } from '../components/customer-detail/SummaryTab'
import { PaymentsTab } from '../components/customer-detail/PaymentsTab'
import { PlanTab } from '../components/customer-detail/PlanTab'
import { POSTab } from '../components/customer-detail/POSTab'
import { RegisterPaymentModal, ChangePlanModal, RegisterPOSModal, DeactivateModal } from '../components/customer-detail/Modals'
import { mockPOS } from '../components/customer-detail/data'
import { cn } from '../lib/utils'

const tabs = [
  { key: 'summary', label: 'Resumen', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { key: 'payments', label: 'Pagos', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { key: 'plan', label: 'Plan', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
  { key: 'pos', label: 'Puntos de Venta', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
]

export default function CustomerDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { getCustomerById, deleteCustomer } = useCustomerStore()
  const { activeTab, setActiveTab, paymentModalOpen, setPaymentModalOpen, planModalOpen, setPlanModalOpen, posModalOpen, setPOSModalOpen, deactivateModalOpen, setDeactivateModalOpen, deactivateLoading, setDeactivateLoading } = useCustomerDetailStore()

  const customer = id ? getCustomerById(id) : undefined
  const posList = mockPOS

  useEffect(() => { if (id && !customer) navigate('/', { replace: true }) }, [id, customer, navigate])

  if (!customer) return null

  const handleDeactivate = async () => {
    if (!user?.idToken) return
    setDeactivateLoading(true)
    try { await deleteCustomer(customer.id, user.idToken); navigate('/') } catch { /* handled by store */ } 
    finally { setDeactivateLoading(false); setDeactivateModalOpen(false) }
  }

  return (
    <div style={{ minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Volver al listado
        </button>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up">
          <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]" />
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--color-primary)]/20">{customer.razonSocial.charAt(0).toUpperCase()}</div>
                <div className={cn('absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--color-card)]', customer.active ? 'bg-emerald-500' : 'bg-gray-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{customer.razonSocial}</h1>
                  <StatusBadge active={customer.active} />
                  {customer.paymentValid && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Pago vigente</span>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1.5">CUIT <code className="font-mono text-[var(--color-foreground)]">{customer.CUIT}</code></span>
                  <span className="flex items-center gap-1.5">POS <code className="font-mono text-[var(--color-foreground)]">{String(customer.puntoVenta).padStart(4, '0')}</code></span>
                  <span className="flex items-center gap-1.5">Plan Pro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up delay-100">
          <div className="flex gap-3 overflow-x-auto px-6 py-4">
            <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => setPlanModalOpen(true)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>Actualizar Plan</Button>
            <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => setPaymentModalOpen(true)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Registrar Pago</Button>
            <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => setPOSModalOpen(true)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>Registrar POS</Button>
            {customer.active && <Button size="sm" variant="destructive" className="flex-shrink-0" onClick={() => setDeactivateModalOpen(true)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>Dar de Baja</Button>}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up delay-100">
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 overflow-x-auto">
            {tabs.map((tab) => <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={cn('flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200', activeTab === tab.key ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border)]')}>{tab.icon}{tab.label}</button>)}
          </div>
          <div className="p-6">
            {activeTab === 'summary' && <SummaryTab customer={customer} />}
            {activeTab === 'payments' && <PaymentsTab onRegisterPayment={() => setPaymentModalOpen(true)} />}
            {activeTab === 'plan' && <PlanTab onChangePlan={() => setPlanModalOpen(true)} />}
            {activeTab === 'pos' && <POSTab posList={posList} onRegisterPOS={() => setPOSModalOpen(true)} />}
          </div>
        </div>
      </div>
      <RegisterPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <ChangePlanModal open={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      <RegisterPOSModal open={posModalOpen} onClose={() => setPOSModalOpen(false)} />
      <DeactivateModal open={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} onConfirm={handleDeactivate} customerName={customer.razonSocial} />
      {deactivateLoading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="flex items-center gap-3 bg-[var(--color-card)] rounded-xl px-6 py-4 shadow-xl border border-[var(--color-border)]"><svg className="animate-spin h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span className="text-sm font-medium text-[var(--color-foreground)]">Procesando...</span></div></div>}
    </div>
  )
}