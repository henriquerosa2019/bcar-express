import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types/database'
import { Loader2, ClipboardList } from 'lucide-react'

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  novo: 'separando',
  separando: 'saindo',
  saindo: 'entregue',
  entregue: null,
}

const statusLabels: Record<OrderStatus, string> = {
  novo: 'Novo',
  separando: 'Separando',
  saindo: 'A Caminho',
  entregue: 'Entregue',
}

export function StoreOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*, mechanic:profiles!mechanic_id(name, phone), items:order_items(quantity, unit_price, part:parts(name))')
      .eq('store_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as unknown as Order[]) ?? [])
        setLoading(false)
      })

    const channel = supabase.channel('store_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${user.id}` },
        payload => setOrders(prev => [payload.new as Order, ...prev]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function advanceStatus(orderId: string, currentStatus: OrderStatus) {
    const next = statusFlow[currentStatus]
    if (!next) return
    await supabase.from('orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <PageHeader title="Pedidos" description="Gerencie todos os pedidos em tempo real" />

      <div className="flex gap-3 mb-6">
        <Select value={filter} onValueChange={v => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(statusLabels) as OrderStatus[]).map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {(Object.keys(statusLabels) as OrderStatus[]).map(s => {
            const count = orders.filter(o => o.status === s).length
            return count > 0 ? (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {statusLabels[s]} ({count})
              </button>
            ) : null
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const next = statusFlow[order.status]
            return (
              <Card key={order.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="font-semibold">{(order as any).mechanic?.name ?? 'Mecânico'}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{order.payment_method.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {item.quantity}x {(item as any).part?.name ?? 'Peça'}
                        </span>
                      ))}
                    </div>
                  )}

                  {order.address && (
                    <p className="text-xs text-muted-foreground mb-3">📍 {order.address}</p>
                  )}

                  {next && (
                    <Button size="sm" onClick={() => advanceStatus(order.id, order.status)}>
                      Avançar para: {statusLabels[next]}
                    </Button>
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
