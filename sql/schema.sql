
-- CLINIC MANAGEMENT SYSTEM SCHEMA

-- 1. Tables
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] NOT NULL,
  address TEXT,
  age INTEGER,
  medical_history TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('SERVICE', 'CONSUMABLE')),
  selling_price DECIMAL(12, 2), -- NULL for consumables
  cost_price DECIMAL(12, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  order_limit INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'pcs'
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES auth.users(id),
  doctor_commission_pct DECIMAL(5, 2) DEFAULT 0,
  total_gross_amount DECIMAL(12, 2) NOT NULL,
  external_fees DECIMAL(12, 2) DEFAULT 0, -- e.g. Transport Fees
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE consumable_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  material_id UUID REFERENCES materials(id),
  quantity INTEGER NOT NULL,
  cost_at_time DECIMAL(12, 2) NOT NULL
);

-- 2. Profit Calculation View
-- Calculates Net Profit = Session Selling Price - Total Cost of Consumables - Doctor Commission
CREATE OR REPLACE VIEW session_profit_analysis AS
SELECT 
  i.id AS invoice_id,
  i.created_at,
  p.name AS patient_name,
  i.total_gross_amount,
  COALESCE(SUM(cl.quantity * cl.cost_at_time), 0) AS total_consumable_cost,
  (i.total_gross_amount * (i.doctor_commission_pct / 100)) AS doctor_commission_amount,
  (i.total_gross_amount - COALESCE(SUM(cl.quantity * cl.cost_at_time), 0) - (i.total_gross_amount * (i.doctor_commission_pct / 100))) AS net_profit
FROM invoices i
JOIN patients p ON i.patient_id = p.id
LEFT JOIN consumable_logs cl ON i.id = cl.invoice_id
GROUP BY i.id, p.name, i.total_gross_amount, i.doctor_commission_pct, i.created_at;

-- 3. Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Admins can see everything
CREATE POLICY admin_all ON invoices FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'ADMIN')
);

-- Receptionists cannot see prices or financial summaries (simplified example)
CREATE POLICY recep_view_basic ON invoices FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'RECEPTIONIST')
);

-- In practice, you would exclude 'total_gross_amount' from the view for Receptionists.
