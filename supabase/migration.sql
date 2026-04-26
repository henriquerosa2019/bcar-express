-- ============================================================
-- BCAR Express — Supabase SQL Migration
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- Enums
CREATE TYPE app_role AS ENUM ('mechanic', 'store', 'delivery');
CREATE TYPE order_status AS ENUM ('novo', 'separando', 'saindo', 'entregue');
CREATE TYPE delivery_status AS ENUM ('pendente', 'em_andamento', 'concluida');
CREATE TYPE payment_method AS ENUM ('pix', 'cartao', 'conta_loja');
CREATE TYPE quote_status AS ENUM ('aberto', 'aprovado', 'expirado', 'convertido');
CREATE TYPE appointment_status AS ENUM ('agendado', 'em_andamento', 'concluido', 'cancelado');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  workshop_name TEXT,
  address TEXT,
  pix_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id)
);

-- Parts catalog
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  system TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  car_brand TEXT,
  car_model TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, code)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id),
  store_id UUID NOT NULL REFERENCES profiles(id),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'novo',
  payment_method payment_method NOT NULL DEFAULT 'pix',
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

-- Deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  delivery_user_id UUID REFERENCES profiles(id),
  status delivery_status NOT NULL DEFAULT 'pendente',
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  receiver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery GPS locations
CREATE TABLE delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (mechanic's clients)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  license_plate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer services history
CREATE TABLE customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT,
  warranty_days INTEGER NOT NULL DEFAULT 0,
  next_service_date DATE,
  cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until DATE NOT NULL,
  status quote_status NOT NULL DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote items
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

-- Service appointments
CREATE TABLE service_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  service_type TEXT NOT NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT
);

-- Service finances
CREATE TABLE service_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  parts_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  charged_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit_margin NUMERIC(5,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT
);

-- Search history
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  converted_to_order BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles catalog
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT UNIQUE,
  brand TEXT,
  model TEXT,
  year INTEGER
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION is_delivery_user_for_order(user_uuid UUID, order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM deliveries
    WHERE order_id = order_uuid AND delivery_user_id = user_uuid
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- profiles: user sees/edits own, store sees all
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.uid() = id OR has_role(auth.uid(), 'store')
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "roles_select" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_insert" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- parts: public read, store owner manages
CREATE POLICY "parts_select" ON parts FOR SELECT USING (TRUE);
CREATE POLICY "parts_insert" ON parts FOR INSERT WITH CHECK (auth.uid() = store_id);
CREATE POLICY "parts_update" ON parts FOR UPDATE USING (auth.uid() = store_id);
CREATE POLICY "parts_delete" ON parts FOR DELETE USING (auth.uid() = store_id);

-- orders
CREATE POLICY "orders_select_mechanic" ON orders FOR SELECT USING (auth.uid() = mechanic_id);
CREATE POLICY "orders_select_store" ON orders FOR SELECT USING (auth.uid() = store_id);
CREATE POLICY "orders_select_delivery" ON orders FOR SELECT USING (
  is_delivery_user_for_order(auth.uid(), id)
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = mechanic_id);
CREATE POLICY "orders_update_store" ON orders FOR UPDATE USING (auth.uid() = store_id);
CREATE POLICY "orders_update_delivery" ON orders FOR UPDATE USING (
  is_delivery_user_for_order(auth.uid(), id)
);

-- order_items
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (mechanic_id = auth.uid() OR store_id = auth.uid()))
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND mechanic_id = auth.uid())
);

-- deliveries
CREATE POLICY "deliveries_select_store" ON deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND store_id = auth.uid())
);
CREATE POLICY "deliveries_select_deliverer" ON deliveries FOR SELECT USING (auth.uid() = delivery_user_id);
CREATE POLICY "deliveries_select_mechanic" ON deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND mechanic_id = auth.uid())
);
CREATE POLICY "deliveries_insert_store" ON deliveries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND store_id = auth.uid())
);
CREATE POLICY "deliveries_update_store" ON deliveries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND store_id = auth.uid())
);
CREATE POLICY "deliveries_update_deliverer" ON deliveries FOR UPDATE USING (auth.uid() = delivery_user_id);

-- delivery_locations
CREATE POLICY "delivery_locations_select" ON delivery_locations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.id = delivery_id
      AND (d.delivery_user_id = auth.uid() OR o.mechanic_id = auth.uid() OR o.store_id = auth.uid())
  )
);
CREATE POLICY "delivery_locations_insert" ON delivery_locations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM deliveries WHERE id = delivery_id AND delivery_user_id = auth.uid())
);

-- customers
CREATE POLICY "customers_all" ON customers FOR ALL USING (auth.uid() = mechanic_id);

-- customer_services
CREATE POLICY "customer_services_all" ON customer_services FOR ALL USING (
  EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND mechanic_id = auth.uid())
);

-- quotes
CREATE POLICY "quotes_all" ON quotes FOR ALL USING (auth.uid() = mechanic_id);

-- quote_items
CREATE POLICY "quote_items_all" ON quote_items FOR ALL USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_id AND mechanic_id = auth.uid())
);

-- service_appointments
CREATE POLICY "appointments_all" ON service_appointments FOR ALL USING (auth.uid() = mechanic_id);

-- service_finances
CREATE POLICY "finances_all" ON service_finances FOR ALL USING (auth.uid() = mechanic_id);

-- search_history
CREATE POLICY "search_history_insert" ON search_history FOR INSERT WITH CHECK (auth.uid() = mechanic_id);
CREATE POLICY "search_history_select_mechanic" ON search_history FOR SELECT USING (auth.uid() = mechanic_id);
CREATE POLICY "search_history_select_store" ON search_history FOR SELECT USING (has_role(auth.uid(), 'store'));

-- vehicles: public read
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT USING (TRUE);

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_locations;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_orders_mechanic ON orders(mechanic_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_parts_store ON parts(store_id);
CREATE INDEX idx_parts_name ON parts USING GIN(to_tsvector('portuguese', name));
CREATE INDEX idx_deliveries_user ON deliveries(delivery_user_id);
CREATE INDEX idx_customers_mechanic ON customers(mechanic_id);
CREATE INDEX idx_search_history_mechanic ON search_history(mechanic_id);
CREATE INDEX idx_search_history_term ON search_history(search_term);
