import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Part } from '@/types/database'
import { Plus, Pencil, Trash2, Loader2, Package, Search } from 'lucide-react'

export function StorePartsPage() {
  const { user } = useAuth()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Part | null>(null)
  const [form, setForm] = useState({ code: '', name: '', system: '', price: '', stock: '', car_brand: '', car_model: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('parts').select('*').eq('store_id', user.id).order('name').then(({ data }) => {
      setParts(data ?? [])
      setLoading(false)
    })
  }, [user])

  function openCreate() {
    setEditing(null)
    setForm({ code: '', name: '', system: '', price: '', stock: '', car_brand: '', car_model: '' })
    setOpen(true)
  }

  function openEdit(part: Part) {
    setEditing(part)
    setForm({ code: part.code, name: part.name, system: part.system ?? '', price: String(part.price), stock: String(part.stock), car_brand: part.car_brand ?? '', car_model: part.car_model ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!user || !form.name || !form.code) return
    setSaving(true)
    const payload = { code: form.code, name: form.name, system: form.system, price: Number(form.price), stock: Number(form.stock), car_brand: form.car_brand, car_model: form.car_model, store_id: user.id }
    if (editing) {
      const { data } = await supabase.from('parts').update(payload).eq('id', editing.id).select().single()
      if (data) setParts(prev => prev.map(p => p.id === editing.id ? data : p))
    } else {
      const { data } = await supabase.from('parts').insert(payload).select().single()
      if (data) setParts(prev => [...prev, data])
    }
    setOpen(false)
    setSaving(false)
  }

  async function handleDelete(partId: string) {
    if (!confirm('Remover esta peça?')) return
    await supabase.from('parts').delete().eq('id', partId)
    setParts(prev => prev.filter(p => p.id !== partId))
  }

  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Catálogo de Peças"
        description="Gerencie seu inventário"
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Peça
          </Button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(part => (
            <Card key={part.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{part.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{part.code}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(part)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(part.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {part.system && <Badge variant="outline" className="text-xs">{part.system}</Badge>}
                  <Badge variant={part.stock > 0 ? 'success' : 'destructive'} className="text-xs ml-auto">
                    {part.stock} un.
                  </Badge>
                </div>
                <p className="font-bold font-mono text-primary">{formatCurrency(part.price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="FRE-001" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Pastilha de freio dianteira" />
            </div>
            <div className="space-y-2">
              <Label>Sistema</Label>
              <Input value={form.system} onChange={e => setForm(p => ({ ...p, system: e.target.value }))} placeholder="Freios" />
            </div>
            <div className="space-y-2">
              <Label>Marca do Veículo</Label>
              <Input value={form.car_brand} onChange={e => setForm(p => ({ ...p, car_brand: e.target.value }))} placeholder="Toyota" />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.car_model} onChange={e => setForm(p => ({ ...p, car_model: e.target.value }))} placeholder="Corolla" />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Estoque</Label>
              <Input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.code}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
