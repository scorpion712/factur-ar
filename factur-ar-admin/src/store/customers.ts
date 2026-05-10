import { create } from 'zustand'
import type { Customer, CustomerFormData } from '../types/customer'
import { customers as customerService } from '../services'

// ─── Estado ────────────────────────────────────────────────────────────────────

type LoadingState = 'idle' | 'loading' | 'error'

interface CustomerState {
  // Datos
  customers: Customer[]
  searchQuery: string
  statusFilter: 'all' | 'active' | 'inactive'

  // Async state
  loadingState: LoadingState
  error: string | null

  // Filtros
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void

  // Operaciones CRUD (usan el servicio)
  fetchAll: (token: string) => Promise<void>
  addCustomer: (form: CustomerFormData, token: string) => Promise<Customer>
  updateCustomer: (id: string, form: Partial<CustomerFormData>, token: string) => Promise<Customer>
  deleteCustomer: (id: string, token: string) => Promise<void>
  getCustomerById: (id: string) => Customer | undefined
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  searchQuery: '',
  statusFilter: 'all',
  loadingState: 'idle',
  error: null,

  // ── Filtros ──────────────────────────────────────────────────────────────────

  setSearchQuery: (query) => set({ searchQuery: query }),

  setStatusFilter: (filter) => set({ statusFilter: filter }),

  // ── Fetch ────────────────────────────────────────────────────────────────────

  fetchAll: async (token) => {
    set({ loadingState: 'loading', error: null })
    try {
      const data = await customerService.getAll(token)
      set({ customers: data, loadingState: 'idle' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar clientes'
      set({ loadingState: 'error', error: message })
    }
  },

  // ── Create ───────────────────────────────────────────────────────────────────

  addCustomer: async (form, token) => {
    const created = await customerService.create(form, token)
    set((state) => ({ customers: [...state.customers, created] }))
    return created
  },

  // ── Update ───────────────────────────────────────────────────────────────────

  updateCustomer: async (id, form, token) => {
    const updated = await customerService.update(id, form, token)
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? updated : c)),
    }))
    return updated
  },

  // ── Delete (soft) ────────────────────────────────────────────────────────────

  deleteCustomer: async (id, token) => {
    await customerService.remove(id, token)
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, active: false, updatedAt: new Date().toISOString() } : c
      ),
    }))
  },

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getCustomerById: (id) => get().customers.find((c) => c.id === id),
}))
