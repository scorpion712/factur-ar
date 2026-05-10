import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useCustomerStore } from '../store/customers'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { CustomerTable } from '../components/CustomerTable'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

const ITEMS_PER_PAGE = 10

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const {
    customers,
    searchQuery,
    statusFilter,
    loadingState,
    error,
    fetchAll,
    setSearchQuery,
    setStatusFilter,
    deleteCustomer,
  } = useCustomerStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Carga inicial de clientes
  useEffect(() => {
    if (user?.idToken) {
      fetchAll(user.idToken)
    }
  }, [user?.idToken, fetchAll])

  // ── Filtrado ──────────────────────────────────────────────────────────────────

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      searchQuery === '' ||
      customer.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.CUIT.includes(searchQuery)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.active) ||
      (statusFilter === 'inactive' && !customer.active)

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter as 'all' | 'active' | 'inactive')
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deleteModalId || !user?.idToken) return
    setDeleteLoading(true)
    try {
      await deleteCustomer(deleteModalId, user.idToken)
    } finally {
      setDeleteLoading(false)
      setDeleteModalId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-mesh bg-dots">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Header
          title="Clientes"
          subtitle="Administra los clientes de FacturAr"
          userEmail={user?.email ?? ''}
          onLogout={logout}
        />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Loading */}
        {loadingState === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-[var(--color-muted-foreground)]">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Cargando clientes...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {loadingState === 'error' && error && (
          <div className="rounded-2xl border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-6 text-center">
            <p className="text-[var(--color-destructive)] font-medium">{error}</p>
            <button
              onClick={() => user?.idToken && fetchAll(user.idToken)}
              className="mt-3 text-sm text-[var(--color-muted-foreground)] underline hover:text-[var(--color-foreground)] transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Table */}
        {loadingState !== 'loading' && loadingState !== 'error' && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/5 overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-muted)]/80 to-[var(--color-muted)]/40">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">CUIT</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Pto. Venta</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Cond. IVA</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Pago</th>
                    <th className="px-6 py-4 w-24" />
                  </tr>
                </thead>
                <tbody>
                  <CustomerTable
                    customers={paginatedCustomers}
                    onDelete={setDeleteModalId}
                  />
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 px-6 py-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        <Modal
          open={!!deleteModalId}
          title="Confirmar Eliminación"
          confirmText={deleteLoading ? 'Eliminando...' : 'Eliminar'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalId(null)}
        >
          ¿Estás seguro de que deseas eliminar este cliente? Esta acción lo desactivará pero conservará sus datos.
        </Modal>
      </div>
    </div>
  )
}
