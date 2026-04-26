import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ShoppingBag, DollarSign, Clock, TrendingUp } from 'lucide-react'

const COLORS = ['hsl(22,100%,50%)', 'hsl(220,70%,50%)', 'hsl(142,70%,45%)', 'hsl(280,70%,50%)']

export function StoreMetricsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, pending: 0, avgSLA: 0 })
  const [paymentData, setPaymentData] = useState<{ name: string; value: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; pedidos: number; receita: number }[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('total, status, payment_method, created_at, updated_at').eq('store_id', user.id).then(({ data }) => {
      const orders = data ?? []
      const revenue = orders.filter(o => o.status === 'entregue').reduce((s, o) => s + o.total, 0)
      const pending = orders.filter(o => o.status !== 'entregue').length

      setStats({ totalOrders: orders.length, revenue, pending, avgSLA: 35 })

      // Payment breakdown
      const pm: Record<string, number> = {}
      orders.forEach(o => { pm[o.payment_method] = (pm[o.payment_method] ?? 0) + 1 })
      setPaymentData(Object.entries(pm).map(([name, value]) => ({ name: name.replace('_', ' '), value })))

      // Monthly
      const monthly: Record<string, { pedidos: number; receita: number }> = {}
      orders.forEach(o => {
        const key = new Date(o.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        if (!monthly[key]) monthly[key] = { pedidos: 0, receita: 0 }
        monthly[key].pedidos += 1
        if (o.status === 'entregue') monthly[key].receita += o.total
      })
      setMonthlyData(Object.entries(monthly).slice(-6).map(([month, data]) => ({ month, ...data })))
    })
  }, [user])

  const cards = [
    { label: 'Total de Pedidos', value: stats.totalOrders.toString(), icon: ShoppingBag },
    { label: 'Receita Total', value: formatCurrency(stats.revenue), icon: DollarSign },
    { label: 'Em Andamento', value: stats.pending.toString(), icon: Clock },
    { label: 'SLA Médio (min)', value: stats.avgSLA.toString(), icon: TrendingUp },
  ]

  return (
    <div>
      <PageHeader title="Métricas da Loja" description="Acompanhe o desempenho do seu negócio" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <card.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-display font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pedidos e Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name) => name === 'receita' ? formatCurrency(v) : v} />
                <Bar yAxisId="left" dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="receita" fill="hsl(220,70%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
