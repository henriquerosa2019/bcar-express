import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { Customer } from '@/types/database'
import { Plus, Car, User2, Loader2, Phone } from 'lucide-react'

export function MechanicCustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', vehicle_brand: '', vehicle_model: '', license_plate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('customers').select('*').eq('mechanic_id', user.id).order('name').then(({ data }) => {
      setCustomers(data ?? [])
      setLoading(false)
    })
  }, [user])

  async function handleSave() {
    if (!user || !form.name) return
    setSaving(true)
    const { data } = await supabase.from('customers').insert({ ...form, mechanic_id: user.id }).select().single()
    if (data) setCustomers(prev => [...prev, data])
    setOpen(false)
    setForm({ name: '', phone: '', vehicle_brand: '', vehicle_model: '', license_plate: '' })
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes e veículos"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </div>
                    )}
                  </div>
                </div>
                {(c.vehicle_brand || c.vehicle_model) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="w-4 h-4" />
                    <span>{[c.vehicle_brand, c.vehicle_model].filter(Boolean).join(' ')}</span>
                    {c.license_plate && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded ml-auto">{c.license_plate}</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Desde {formatDate(c.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome do cliente" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marca do Veículo</Label>
                <Input placeholder="Toyota" value={form.vehicle_brand} onChange={e => setForm(p => ({ ...p, vehicle_brand: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input placeholder="Corolla" value={form.vehicle_model} onChange={e => setForm(p => ({ ...p, vehicle_model: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <Input placeholder="ABC-1234" value={form.license_plate} onChange={e => setForm(p => ({ ...p, license_plate: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
