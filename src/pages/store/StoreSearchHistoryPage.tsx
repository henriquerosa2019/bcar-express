import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { SearchHistory } from '@/types/database'
import { Loader2, Search, TrendingUp, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function StoreSearchHistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Fetch searches from mechanics who ordered from this store
    supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [user])

  // Top searched terms
  const termCounts = history.reduce<Record<string, { count: number; converted: number }>>((acc, h) => {
    if (!acc[h.search_term]) acc[h.search_term] = { count: 0, converted: 0 }
    acc[h.search_term].count += 1
    if (h.converted_to_order) acc[h.search_term].converted += 1
    return acc
  }, {})

  const topTerms = Object.entries(termCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([term, data]) => ({
      term,
      buscas: data.count,
      conversao: data.count > 0 ? Math.round((data.converted / data.count) * 100) : 0,
    }))

  const notFound = history
    .filter(h => h.results_count === 0)
    .reduce<Record<string, number>>((acc, h) => {
      acc[h.search_term] = (acc[h.search_term] ?? 0) + 1
      return acc
    }, {})

  const topNotFound = Object.entries(notFound)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <div>
      <PageHeader title="Histórico de Buscas" description="Entenda o que os mecânicos estão procurando" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Termos Mais Buscados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topTerms} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="term" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="buscas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Demandas Não Atendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : topNotFound.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ótimo! Nenhuma busca sem resultado.</p>
            ) : (
              <div className="space-y-2">
                {topNotFound.map(([term, count]) => (
                  <div key={term} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{term}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">{count}x</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent searches table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Buscas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {history.slice(0, 30).map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span>{h.search_term}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-xs">{h.results_count} resultado(s)</span>
                    {h.converted_to_order && (
                      <Badge variant="success" className="text-xs">Converteu</Badge>
                    )}
                    {h.results_count === 0 && (
                      <Badge variant="destructive" className="text-xs">Sem resultado</Badge>
                    )}
                    <span className="text-xs">{formatDateTime(h.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
