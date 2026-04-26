import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ShoppingBag, DollarSign, TrendingUp, Package } from 'lucide-react'

export function MechanicMetricsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, avgOrder: 0, thisMonth: 0 })
  const [chartData, setChartData] = useState<{ month: string; valor: number; pedidos: number }[]>([])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('orders').select('total, created_at').eq('mechanic_id', user.id).eq('status', 'entregue'),
    ]).then(([ordersRes]) => {
      const orders = ordersRes.data ?? []
      const totalSpent = orders.reduce((s, o) => s + o.total, 0)
      const now = new Date()
      const thisMonth = orders.filter(o => {
        const d = new Date(o.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).reduce((s, o) => s + o.total, 0)

      setStats({
        totalOrders: orders.length,
        totalSpent,
        avgOrder: orders.length ? totalSpent / orders.length : 0,
        thisMonth,
      })

      // Build monthly chart data
      const monthly: Record<string, { valor: number; pedidos: number }> = {}
      orders.forEach(o => {
        const d = new Date(o.created_at)
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`
        if (!monthly[key]) monthly[key] = { valor: 0, pedidos: 0 }
        monthly[key].valor += o.total
        monthly[key].pedidos += 1
      })
      setChartData(
        Object.entries(monthly).slice(-6).map(([month, data]) => ({ month, ...data }))
      )
    })
  }, [user])

  const cards = [
    { label: 'Total de Pedidos', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Total Gasto', value: formatCurrency(stats.totalSpent), icon: DollarSign, color: 'text-primary' },
    { label: 'Ticket Médio', value: formatCurrency(stats.avgOrder), icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Este Mês', value: formatCurrency(stats.thisMonth), icon: Package, color: 'text-amber-500' },
  ]

  return (
    <div>
      <PageHeader title="Métricas" description="Acompanhe seu desempenho" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-xl font-display font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gasto Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pedidos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
