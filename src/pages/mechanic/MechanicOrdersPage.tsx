import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types/database'
import { Loader2, Package, MapPin } from 'lucide-react'

export function MechanicOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*, items:order_items(*, part:parts(name, code)), delivery:deliveries(*)')
      .eq('mechanic_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as unknown as Order[]) ?? [])
        setLoading(false)
      })

    // Real-time updates
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `mechanic_id=eq.${user.id}`,
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const statusSteps = ['novo', 'separando', 'saindo', 'entregue'] as const

  return (
    <div>
      <PageHeader title="Meus Pedidos" description="Acompanhe seus pedidos em tempo real" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum pedido ainda</p>
          <p className="text-sm mt-1">Seus pedidos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const stepIdx = statusSteps.indexOf(order.status)
            return (
              <Card key={order.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.created_at)}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center gap-0">
                      {statusSteps.map((step, idx) => (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${idx <= stepIdx ? 'bg-primary' : 'bg-border'}`} />
                          {idx < statusSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 ${idx < stepIdx ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {['Novo', 'Separando', 'A caminho', 'Entregue'].map((label, idx) => (
                        <span key={label} className={`text-[10px] ${idx <= stepIdx ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.quantity}x {item.part?.name ?? 'Peça'}</span>
                          <span className="font-mono text-xs">{formatCurrency(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Address */}
                  {order.status === 'saindo' && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-primary/5 rounded-lg text-sm text-primary">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Entregador a caminho — rastreamento disponível</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
