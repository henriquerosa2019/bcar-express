import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wrench, Loader2, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/types/database'

const roles: { value: AppRole; label: string; description: string }[] = [
  { value: 'mechanic', label: 'Mecânico', description: 'Compre peças para sua oficina' },
  { value: 'store', label: 'Loja', description: 'Venda peças e gerencie entregas' },
  { value: 'delivery', label: 'Entregador', description: 'Realize entregas de pedidos' },
]

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('mechanic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, name, role)
    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="font-display font-bold text-lg">BCAR Express</p>
        </div>

        <h2 className="text-2xl font-display font-bold mb-1">Criar sua conta</h2>
        <p className="text-muted-foreground text-sm mb-8">Escolha seu perfil e comece agora</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selection */}
          <div className="space-y-2">
            <Label>Tipo de conta</Label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-center transition-all',
                    role === r.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <UserCheck className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-semibold">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="João Silva" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
