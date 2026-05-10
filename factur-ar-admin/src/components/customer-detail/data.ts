import type { Payment, Plan, PlanChange, PointOfSale } from '../../types/customer'

export const mockPayments: Payment[] = [
  { id: '1', date: '2026-05-01', amount: 4500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260501' },
  { id: '2', date: '2026-04-01', amount: 4500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260401' },
  { id: '3', date: '2026-03-01', amount: 4500, status: 'paid', method: 'Efectivo' },
  { id: '4', date: '2026-02-01', amount: 3500, status: 'paid', method: 'Transferencia', reference: 'TRF-20260201' },
  { id: '5', date: '2026-01-01', amount: 3500, status: 'overdue', method: 'Pendiente' },
]

export const PLANS: Record<string, Plan> = {
  base: { id: 'base', name: 'Plan Base', price: 3500, features: ['Hasta 500 facturas/mes', '1 Punto de Venta', 'Soporte email'] },
  pro: { id: 'pro', name: 'Plan Pro', price: 4500, features: ['Hasta 2000 facturas/mes', '3 Puntos de Venta', 'Soporte prioritario', 'API access'] },
  enterprise: { id: 'enterprise', name: 'Plan Enterprise', price: 8500, features: ['Facturas ilimitadas', 'Puntos de Venta ilimitados', 'Soporte 24/7', 'API access', 'SLA 99.9%'] },
}

export const mockPlanHistory: PlanChange[] = [
  { id: '1', date: '2026-02-01', fromPlan: 'Plan Base', toPlan: 'Plan Pro', changedBy: 'admin@facturar.ar' },
  { id: '2', date: '2025-10-15', fromPlan: 'Gratuito', toPlan: 'Plan Base', changedBy: 'admin@facturar.ar' },
]

export const mockPOS: PointOfSale[] = [
  { id: '1', name: 'Casa Central', address: 'Av. Corrientes 1234, CABA', status: 'active', createdAt: '2025-10-15' },
  { id: '2', name: 'Sucursal Norte', address: 'Cabildo 4567, CABA', status: 'active', createdAt: '2026-01-10' },
]