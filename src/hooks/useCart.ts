import { useState, useCallback } from 'react'
import type { CartItem, Part } from '@/types/database'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((part: Part, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.part.id === part.id)
      if (existing) {
        return prev.map(i => i.part.id === part.id ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, { part, quantity }]
    })
  }, [])

  const removeItem = useCallback((partId: string) => {
    setItems(prev => prev.filter(i => i.part.id !== partId))
  }, [])

  const updateQuantity = useCallback((partId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.part.id !== partId))
    } else {
      setItems(prev => prev.map(i => i.part.id === partId ? { ...i, quantity } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count }
}
