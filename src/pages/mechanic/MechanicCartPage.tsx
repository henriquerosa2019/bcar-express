import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Minus, Plus, X, ShoppingCart, Loader2, ArrowLeft } from 'lucide-react'
import type { PaymentMethod } from '@/types/database'
import { Link } from 'react-router-dom'

export function MechanicCartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [placing, setPlacing] = useState(false)

  async function placeOrder() {
    if (!user || items.length === 0) return
    setPlacing(true)
    try {
      // Assuming single store for simplicity; in prod, group by store
      const storeId = items[0].part.store_id

      const { data: order } = await supabase.from('orders').insert({
        mechanic_id: user.id,
        store_id: storeId,
        total,
        status: 'novo',
        payment_method: paymentMethod,
        address,
      }).select().single()

      if (order) {
        await supabase.from('order_items').insert(
          items.map(i => ({
            order_id: order.id,
            part_id: i.part.id,
            quantity: i.quantity,
            unit_price: i.part.price,
          }))
        )

        // Decrease stock
        for (const item of items) {
          await supabase.from('parts').update({ stock: item.part.stock - item.quantity }).eq('id', item.part.id)
        }

        clearCart()
        navigate('/mechanic/orders')
      }
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Carrinho" />
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Carrinho vazio</p>
          <Link to="/mechanic">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Buscar peças
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Carrinho" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <Card key={item.part.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.part.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.part.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.part.id, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.part.id, item.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <p className="font-mono text-sm font-semibold w-24 text-right">
                  {formatCurrency(item.part.price * item.quantity)}
                </p>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => removeItem(item.part.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout */}
        <Card className="h-fit">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display font-semibold">Finalizar Pedido</h3>

            <div className="space-y-2">
              <Label>Endereço de entrega</Label>
              <Input placeholder="Rua, número, bairro" value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="conta_loja">Conta na Loja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button className="w-full" onClick={placeOrder} disabled={placing || !address}>
              {placing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Fazer Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
