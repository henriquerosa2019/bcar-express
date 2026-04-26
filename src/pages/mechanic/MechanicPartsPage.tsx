import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Part } from '@/types/database'
import {
  Search, ShoppingCart, Package, Plus, Minus, X,
  ChevronRight, Loader2, BoxSelect
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function MechanicPartsPage() {
  const { user } = useAuth()
  const { items, addItem, updateQuantity, removeItem, total, count } = useCart()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState('')

  const searchParts = useCallback(async (q: string, sys: string) => {
    setLoading(true)
    try {
      let req = supabase.from('parts').select('*').gt('stock', 0).order('name')
      if (q) req = req.or(`name.ilike.%${q}%,code.ilike.%${q}%`)
      if (sys) req = req.eq('system', sys)
      const { data } = await req.limit(50)
      setParts(data ?? [])

      // Log search history
      if (q && user) {
        await supabase.from('search_history').insert({
          mechanic_id: user.id,
          search_term: q,
          results_count: data?.length ?? 0,
          converted_to_order: false,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    searchParts(query, system)
  }, [searchParts, query, system])

  const cartItem = (partId: string) => items.find(i => i.part.id === partId)

  return (
    <div>
      <PageHeader
        title="Buscar Peças"
        description="Encontre as peças que você precisa"
        action={
          count > 0 ? (
            <Link to="/mechanic/cart">
              <Button className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Carrinho ({count})
                <Badge variant="secondary" className="ml-1 font-mono">{formatCurrency(total)}</Badge>
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            className="pl-9"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Input
          placeholder="Sistema (motor, freio...)"
          className="w-48"
          value={system}
          onChange={e => setSystem(e.target.value)}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : parts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BoxSelect className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma peça encontrada</p>
          <p className="text-sm mt-1">Tente outro termo de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts.map(part => {
            const inCart = cartItem(part.id)
            return (
              <Card key={part.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {part.image_url && (
                    <img src={part.image_url} alt={part.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{part.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{part.code}</p>
                    </div>
                    <p className="text-primary font-bold font-mono text-sm whitespace-nowrap">
                      {formatCurrency(part.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {part.system && <Badge variant="outline" className="text-xs">{part.system}</Badge>}
                    {part.car_brand && <Badge variant="outline" className="text-xs">{part.car_brand}</Badge>}
                    <Badge variant={part.stock > 5 ? 'success' : 'warning'} className="text-xs ml-auto">
                      {part.stock} un.
                    </Badge>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(part.id, inCart.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="flex-1 text-center text-sm font-mono font-medium">{inCart.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(part.id, inCart.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(part.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full gap-2" onClick={() => addItem(part)}>
                      <Plus className="w-3 h-3" />
                      Adicionar
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
