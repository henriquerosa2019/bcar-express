import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ServiceFinance } from '@/types/database'
import { Plus, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function MechanicFinancesPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<ServiceFinance[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ description: '', parts_cost: '', labor_cost: '', charged_amount: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('service_finances')
      .select('*')
      .eq('mechanic_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setRecords(data ?? [])
        setLoading(false)
      })
  }, [user])

  const totalRevenue = records.reduce((s, r) => s + r.charged_amount, 0)
  const totalCost = records.reduce((s, r) => s + r.parts_cost + r.labor_cost, 0)
  const totalProfit = totalRevenue - totalCost

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const partsCost = Number(form.parts_cost) || 0
    const laborCost = Number(form.labor_cost) || 0
    const chargedAmount = Number(form.charged_amount) || 0
    const profitMargin = chargedAmount > 0 ? ((chargedAmount - partsCost - laborCost) / chargedAmount) * 100 : 0

    const { data } = await supabase
      .from('service_finances')
      .insert({
        mechanic_id: user.id,
        description: form.description,
        parts_cost: partsCost,
        labor_cost: laborCost,
        charged_amount: chargedAmount,
        profit_margin: profitMargin,
        date: form.date,
      })
      .select()
      .single()

    if (data) setRecords(prev => [data, ...prev])
    setOpen(false)
    setForm({ description: '', parts_cost: '', labor_cost: '', charged_amount: '', date: new Date().toISOString().split('T')[0] })
    setSaving(false)
  }

  const chartData = records.slice(0, 10).reverse().map(r => ({
    date: formatDate(r.date),
    receita: r.charged_amount,
    custo: r.parts_cost + r.labor_cost,
  }))

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Controle suas receitas e despesas"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-display font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Custos Totais</p>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-xl font-display font-bold text-destructive">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Lucro Líquido</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className={`text-xl font-display font-bold ${totalProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-3">Receita vs Custo</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="receita" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="custo" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} name="Custo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{r.description || 'Serviço'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-emerald-600">{formatCurrency(r.charged_amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Margem: {r.profit_margin.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Troca de óleo — Toyota Corolla" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Custo Peças (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.parts_cost} onChange={e => setForm(p => ({ ...p, parts_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Mão de Obra (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.labor_cost} onChange={e => setForm(p => ({ ...p, labor_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cobrado (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.charged_amount} onChange={e => setForm(p => ({ ...p, charged_amount: e.target.value }))} />
              </div>
            </div>
            {form.parts_cost && form.labor_cost && form.charged_amount && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Margem estimada: </span>
                <span className="font-semibold text-primary">
                  {(((Number(form.charged_amount) - Number(form.parts_cost) - Number(form.labor_cost)) / Number(form.charged_amount)) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
