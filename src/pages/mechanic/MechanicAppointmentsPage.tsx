import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import type { ServiceAppointment, AppointmentStatus } from '@/types/database'
import { Plus, Calendar, Loader2 } from 'lucide-react'

const statusConfig: Record<AppointmentStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  agendado: { label: 'Agendado', variant: 'info' },
  em_andamento: { label: 'Em andamento', variant: 'warning' },
  concluido: { label: 'Concluído', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
}

export function MechanicAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ scheduled_date: '', service_type: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('service_appointments')
      .select('*, customer:customers(name)')
      .eq('mechanic_id', user.id)
      .order('scheduled_date')
      .then(({ data }) => {
        setAppointments((data as unknown as ServiceAppointment[]) ?? [])
        setLoading(false)
      })
  }, [user])

  async function handleSave() {
    if (!user || !form.scheduled_date || !form.service_type) return
    setSaving(true)
    const { data } = await supabase
      .from('service_appointments')
      .insert({ ...form, mechanic_id: user.id, status: 'agendado' })
      .select()
      .single()
    if (data) setAppointments(prev => [...prev, data as unknown as ServiceAppointment])
    setOpen(false)
    setForm({ scheduled_date: '', service_type: '', notes: '' })
    setSaving(false)
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    await supabase.from('service_appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Gerencie seus agendamentos de serviços"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum agendamento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => {
            const config = statusConfig[appt.status]
            return (
              <Card key={appt.id}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appt.service_type}</p>
                    {(appt as any).customer && (
                      <p className="text-sm text-muted-foreground">{(appt as any).customer.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(appt.scheduled_date)}</p>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{appt.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {appt.status === 'agendado' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, 'em_andamento')}>
                        Iniciar
                      </Button>
                    )}
                    {appt.status === 'em_andamento' && (
                      <Button size="sm" onClick={() => updateStatus(appt.id, 'concluido')}>
                        Concluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Serviço *</Label>
              <Input
                placeholder="Troca de óleo, alinhamento..."
                value={form.service_type}
                onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                placeholder="Detalhes adicionais..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.service_type || !form.scheduled_date}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
