import { Link } from 'react-router-dom'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onFilterChange: (filter: string) => void
}

const statusOptions = [
  { value: 'all', label: 'Todos los estados', icon: null },
  { value: 'active', label: 'Activos', icon: '●' },
  { value: 'inactive', label: 'Inactivos', icon: '○' },
]

export function SearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
}: SearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-md group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg
            className="w-4 h-4 text-[var(--color-muted-foreground)] group-focus-within:text-[var(--color-primary)] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Input
          type="text"
          placeholder="Buscar por nombre o CUIT..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-11 h-10 bg-[var(--color-muted)]/30 border-transparent focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--color-muted)]/50">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
              statusFilter === option.value
                ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <Link to="/customer/new">
        <Button className="h-10 px-5 shadow-md shadow-[var(--color-primary)]/15 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </Button>
      </Link>
    </div>
  )
}