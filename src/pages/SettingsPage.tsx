import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle } from 'lucide-react'

export function SettingsPage() {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    workshop_name: profile?.workshop_name ?? '',
    address: profile?.address ?? '',
    pix_key: profile?.pix_key ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Gerencie seu perfil e preferências" />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Dados do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Nome da Oficina / Loja</Label>
            <Input value={form.workshop_name} onChange={e => setForm(p => ({ ...p, workshop_name: e.target.value }))} placeholder="Auto Peças Brasil" />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input value={form.pix_key} onChange={e => setForm(p => ({ ...p, pix_key: e.target.value }))} placeholder="CPF, email ou chave aleatória" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : null}
            {saved ? 'Salvo!' : 'Salvar alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
