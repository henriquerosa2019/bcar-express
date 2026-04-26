import { Badge } from '@/components/ui/badge'
import type { OrderStatus, DeliveryStatus } from '@/types/database'

const orderStatusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'warning' | 'info' | 'success' }> = {
  novo: { label: 'Novo', variant: 'info' },
  separando: { label: 'Separando', variant: 'warning' },
  saindo: { label: 'A caminho', variant: 'default' },
  entregue: { label: 'Entregue', variant: 'success' },
}

const deliveryStatusConfig: Record<DeliveryStatus, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  em_andamento: { label: 'Em andamento', variant: 'default' },
  concluida: { label: 'Concluída', variant: 'success' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const config = deliveryStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
