export type AppRole = 'mechanic' | 'store' | 'delivery'
export type OrderStatus = 'novo' | 'separando' | 'saindo' | 'entregue'
export type DeliveryStatus = 'pendente' | 'em_andamento' | 'concluida'
export type PaymentMethod = 'pix' | 'cartao' | 'conta_loja'
export type QuoteStatus = 'aberto' | 'aprovado' | 'expirado' | 'convertido'
export type AppointmentStatus = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface Profile {
  id: string
  email: string
  name: string
  phone?: string
  workshop_name?: string
  address?: string
  pix_key?: string
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: AppRole
}

export interface Part {
  id: string
  code: string
  name: string
  system?: string
  price: number
  stock: number
  car_brand?: string
  car_model?: string
  image_url?: string
  store_id: string
  created_at: string
}

export interface Order {
  id: string
  mechanic_id: string
  store_id: string
  total: number
  status: OrderStatus
  payment_method: PaymentMethod
  address: string
  notes?: string
  created_at: string
  updated_at: string
  mechanic?: Profile
  items?: OrderItem[]
  delivery?: Delivery
}

export interface OrderItem {
  id: string
  order_id: string
  part_id: string
  quantity: number
  unit_price: number
  part?: Part
}

export interface Delivery {
  id: string
  order_id: string
  delivery_user_id?: string
  status: DeliveryStatus
  delivery_fee: number
  receiver_name?: string
  created_at: string
  updated_at: string
  deliverer?: Profile
}

export interface DeliveryLocation {
  id: string
  delivery_id: string
  lat: number
  lng: number
  updated_at: string
}

export interface Customer {
  id: string
  mechanic_id: string
  name: string
  phone?: string
  vehicle_brand?: string
  vehicle_model?: string
  license_plate?: string
  created_at: string
  services?: CustomerService[]
}

export interface CustomerService {
  id: string
  customer_id: string
  service_type: string
  description?: string
  warranty_days: number
  next_service_date?: string
  cost?: number
  created_at: string
}

export interface Quote {
  id: string
  mechanic_id: string
  customer_name: string
  customer_phone?: string
  total: number
  valid_until: string
  status: QuoteStatus
  notes?: string
  created_at: string
  items?: QuoteItem[]
}

export interface QuoteItem {
  id: string
  quote_id: string
  part_id?: string
  description: string
  quantity: number
  unit_price: number
  part?: Part
}

export interface ServiceAppointment {
  id: string
  mechanic_id: string
  customer_id?: string
  scheduled_date: string
  service_type: string
  status: AppointmentStatus
  notes?: string
  customer?: Customer
}

export interface ServiceFinance {
  id: string
  mechanic_id: string
  order_id?: string
  parts_cost: number
  labor_cost: number
  charged_amount: number
  profit_margin: number
  date: string
  description?: string
}

export interface SearchHistory {
  id: string
  mechanic_id: string
  search_term: string
  results_count: number
  converted_to_order: boolean
  created_at: string
}

export interface CartItem {
  part: Part
  quantity: number
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      user_roles: { Row: UserRole; Insert: Omit<UserRole, 'id'>; Update: Partial<UserRole> }
      parts: { Row: Part; Insert: Omit<Part, 'id' | 'created_at'>; Update: Partial<Part> }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, 'id'>; Update: Partial<OrderItem> }
      deliveries: { Row: Delivery; Insert: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Delivery> }
      delivery_locations: { Row: DeliveryLocation; Insert: Omit<DeliveryLocation, 'id'>; Update: Partial<DeliveryLocation> }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at'>; Update: Partial<Customer> }
      customer_services: { Row: CustomerService; Insert: Omit<CustomerService, 'id' | 'created_at'>; Update: Partial<CustomerService> }
      quotes: { Row: Quote; Insert: Omit<Quote, 'id' | 'created_at'>; Update: Partial<Quote> }
      quote_items: { Row: QuoteItem; Insert: Omit<QuoteItem, 'id'>; Update: Partial<QuoteItem> }
      service_appointments: { Row: ServiceAppointment; Insert: Omit<ServiceAppointment, 'id'>; Update: Partial<ServiceAppointment> }
      service_finances: { Row: ServiceFinance; Insert: Omit<ServiceFinance, 'id'>; Update: Partial<ServiceFinance> }
      search_history: { Row: SearchHistory; Insert: Omit<SearchHistory, 'id' | 'created_at'>; Update: Partial<SearchHistory> }
    }
  }
}
