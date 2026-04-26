import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DeliveryStatusBadge } from '@/components/ui/status-badge'
import { formatDateTime } from '@/lib/utils'
import type { Delivery } from '@/types/database'
import { Loader2, MapPin, CheckCircle, Package } from 'lucide-react'

export function DeliveryPage() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Delivery | null>(null)
  const [receiverName, setReceiverName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('deliveries').select('*, order:orders(total, address, mechanic:profiles!mechanic_id(name, phone))').eq('delivery_user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setDeliveries((data as unknown as Delivery[]) ?? [])
      setLoading(false)
    })
  }, [user])

  async function startDelivery(deliveryId: string) {
    await supabase.from('deliveries').update({ status: 'em_andamento' }).eq('id', deliveryId)
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: 'em_andamento' } : d))
  }

  async function confirmDelivery() {
    if (!selected || !receiverName) return
    setSaving(true)
    await supabase.from('deliveries').update({ status: 'concluida', receiver_name: receiverName }).eq('id', selected.id)
    await supabase.from('orders').update({ status: 'entregue' }).eq('id', selected.order_id)
    setDeliveries(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'concluida', receiver_name: receiverName } : d))
    setConfirmOpen(false)
    setReceiverName('')
    setSaving(false)
  }

  async function updateLocation(deliveryId: string) {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      await supabase.from('delivery_locations').insert({
        delivery_id: deliveryId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      })
    })
  }

  return (
    <div>
      <PageHeader title="Minhas Entregas" description="Gerencie suas entregas do dia" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma entrega atribuída</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map(delivery => {
            const order = (delivery as any).order
            return (
              <Card key={delivery.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">#{delivery.id.slice(0, 8).toUpperCase()}</p>
                      <p className="font-semibold mt-1">{order?.mechanic?.name ?? 'Cliente'}</p>
                      {order?.mechanic?.phone && (
                        <p className="text-xs text-muted-foreground">{order.mechanic.phone}</p>
                      )}
                    </div>
                    <DeliveryStatusBadge status={delivery.status} />
                  </div>

                  {order?.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{order.address}</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-3">{formatDateTime(delivery.created_at)}</p>

                  <div className="flex gap-2">
                    {delivery.status === 'pendente' && (
                      <Button size="sm" onClick={() => startDelivery(delivery.id)}>
                        Iniciar Entrega
                      </Button>
                    )}
                    {delivery.status === 'em_andamento' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateLocation(delivery.id)}>
                          <MapPin className="w-3 h-3 mr-1" />
                          Atualizar GPS
                        </Button>
                        <Button size="sm" onClick={() => { setSelected(delivery); setConfirmOpen(true) }}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Confirmar Entrega
                        </Button>
                      </>
                    )}
                    {delivery.status === 'concluida' && delivery.receiver_name && (
                      <p className="text-xs text-emerald-600">✓ Recebido por: {delivery.receiver_name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome de quem recebeu</Label>
            <Input placeholder="Nome completo" value={receiverName} onChange={e => setReceiverName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={confirmDelivery} disabled={saving || !receiverName}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
