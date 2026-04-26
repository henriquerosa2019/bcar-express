import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote } from '@/types/database'
import { Plus, FileText, Loader2 } from 'lucide-react'

const statusConfig = {
  aberto: { label: 'Aberto', variant: 'info' as const },
  aprovado: { label: 'Aprovado', variant: 'success' as const },
  expirado: { label: 'Expirado', variant: 'secondary' as const },
  convertido: { label: 'Convertido', variant: 'default' as const },
}

export function MechanicQuotesPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('quotes').select('*, items:quote_items(*)').eq('mechanic_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setQuotes((data as unknown as Quote[]) ?? [])
      setLoading(false)
    })
  }, [user])

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Gerencie seus orçamentos para clientes"
        action={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum orçamento ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(quote => {
            const config = statusConfig[quote.status]
            return (
              <Card key={quote.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{quote.customer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Válido até {formatDate(quote.valid_until)} · {quote.items?.length ?? 0} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold font-mono">{formatCurrency(quote.total)}</p>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                  </div>
                  {quote.status === 'aberto' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">Ver detalhes</Button>
                      <Button size="sm">Converter em pedido</Button>
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
