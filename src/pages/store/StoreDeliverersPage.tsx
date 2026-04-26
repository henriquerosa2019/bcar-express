import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { Loader2, Truck, Package } from 'lucide-react'

interface DelivererStats {
  profile: Profile
  total: number
  completed: number
  earnings: number
}

export function StoreDeliverersPage() {
  const { user } = useAuth()
  const [deliverers, setDeliverers] = useState<DelivererStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Fetch deliveries for this store's orders
    supabase
      .from('deliveries')
      .select('*, deliverer:profiles!delivery_user_id(id, name, phone, email), order:orders!inner(store_id)')
      .eq('order.store_id', user.id)
      .then(({ data }) => {
        const deliveries = data ?? []
        // Group by deliverer
        const map = new Map<string, DelivererStats>()
        deliveries.forEach((d: any) => {
          if (!d.deliverer) return
          const id = d.deliverer.id
          if (!map.has(id)) {
            map.set(id, { profile: d.deliverer, total: 0, completed: 0, earnings: 0 })
          }
          const stats = map.get(id)!
          stats.total += 1
          if (d.status === 'concluida') {
            stats.completed += 1
            stats.earnings += d.delivery_fee ?? 0
          }
        })
        setDeliverers(Array.from(map.values()))
        setLoading(false)
      })
  }, [user])

  return (
    <div>
      <PageHeader title="Entregadores" description="Acompanhe o desempenho dos seus entregadores" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : deliverers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum entregador encontrado</p>
          <p className="text-sm mt-1">Os entregadores aparecem aqui após realizarem entregas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliverers.map(({ profile, total, completed, earnings }) => (
            <Card key={profile.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">{profile.phone ?? profile.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-lg font-bold font-display">{total}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-lg font-bold font-display text-emerald-600">{completed}</p>
                    <p className="text-[10px] text-muted-foreground">Concluídas</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-sm font-bold font-mono text-primary">{formatCurrency(earnings)}</p>
                    <p className="text-[10px] text-muted-foreground">Ganhos</p>
                  </div>
                </div>
                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Taxa de conclusão</span>
                      <span>{((completed / total) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{ width: `${(completed / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
