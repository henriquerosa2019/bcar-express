import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Wrench, ShoppingCart, Package, Users, BarChart2,
  FileText, Calendar, DollarSign, LogOut, ChevronRight,
  Truck, MapPin, ClipboardList, Settings, Store, History
} from 'lucide-react'

const mechanicNav = [
  { to: '/mechanic', label: 'Buscar Peças', icon: Package, end: true },
  { to: '/mechanic/orders', label: 'Meus Pedidos', icon: ClipboardList },
  { to: '/mechanic/customers', label: 'Clientes', icon: Users },
  { to: '/mechanic/quotes', label: 'Orçamentos', icon: FileText },
  { to: '/mechanic/appointments', label: 'Agenda', icon: Calendar },
  { to: '/mechanic/finances', label: 'Financeiro', icon: DollarSign },
  { to: '/mechanic/metrics', label: 'Métricas', icon: BarChart2 },
]

const storeNav = [
  { to: '/store', label: 'Pedidos', icon: ClipboardList, end: true },
  { to: '/store/parts', label: 'Catálogo de Peças', icon: Package },
  { to: '/store/deliverers', label: 'Entregadores', icon: Truck },
  { to: '/store/search-history', label: 'Histórico de Buscas', icon: History },
  { to: '/store/metrics', label: 'Métricas', icon: BarChart2 },
]

const deliveryNav = [
  { to: '/delivery', label: 'Minhas Entregas', icon: MapPin, end: true },
]

const navByRole = {
  mechanic: mechanicNav,
  store: storeNav,
  delivery: deliveryNav,
}

const roleLabels = {
  mechanic: 'Mecânico',
  store: 'Loja',
  delivery: 'Entregador',
}

const roleIcons = {
  mechanic: Wrench,
  store: Store,
  delivery: Truck,
}

export function Sidebar() {
  const { profile, role, signOut } = useAuth()
  if (!role) return null

  const nav = navByRole[role]
  const RoleIcon = roleIcons[role]

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold text-base leading-none">BCAR</p>
          <p className="text-xs text-muted-foreground font-mono">Express</p>
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <RoleIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 border-t border-border pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Settings className="w-4 h-4" />
          Configurações
        </NavLink>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
