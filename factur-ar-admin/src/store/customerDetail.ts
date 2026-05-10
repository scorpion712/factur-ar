import { create } from 'zustand'

type Tab = 'summary' | 'payments' | 'plan' | 'pos'

interface CustomerDetailState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  paymentModalOpen: boolean
  setPaymentModalOpen: (open: boolean) => void
  planModalOpen: boolean
  setPlanModalOpen: (open: boolean) => void
  posModalOpen: boolean
  setPOSModalOpen: (open: boolean) => void
  deactivateModalOpen: boolean
  setDeactivateModalOpen: (open: boolean) => void
  deactivateLoading: boolean
  setDeactivateLoading: (loading: boolean) => void
}

export const useCustomerDetailStore = create<CustomerDetailState>((set) => ({
  activeTab: 'summary',
  setActiveTab: (tab) => set({ activeTab: tab }),
  paymentModalOpen: false,
  setPaymentModalOpen: (open) => set({ paymentModalOpen: open }),
  planModalOpen: false,
  setPlanModalOpen: (open) => set({ planModalOpen: open }),
  posModalOpen: false,
  setPOSModalOpen: (open) => set({ posModalOpen: open }),
  deactivateModalOpen: false,
  setDeactivateModalOpen: (open) => set({ deactivateModalOpen: open }),
  deactivateLoading: false,
  setDeactivateLoading: (loading) => set({ deactivateLoading: loading }),
}))