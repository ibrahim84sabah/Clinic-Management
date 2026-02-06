
-- CLINIC MANAGEMENT SYSTEM SCHEMA (UPDATED RLS)

-- 1. Tables
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] NOT NULL,
  address TEXT,
  age INTEGER,
  medical_history TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('SERVICE', 'CONSUMABLE')),
  selling_price DECIMAL(12, 2), -- NULL for consumables
  cost_price DECIMAL(12, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  order_limit INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES auth.users(id),
  doctor_commission_pct DECIMAL(5, 2) DEFAULT 0,
  total_gross_amount DECIMAL(12, 2) NOT NULL,
  external_fees DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profit Calculation View
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

-- 3. Row Level Security (RLS) FIX
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR MATERIALS (The fix for your error)
-- 1. Allow Admin to do everything
CREATE POLICY admin_full_access_materials ON materials 
FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN');

-- 2. Allow Doctors and Receptionists to VIEW (SELECT) only
CREATE POLICY staff_view_materials ON materials 
FOR SELECT TO authenticated 
USING (TRUE);

-- 3. Allow Receptionists to Update stock (for inventory management)
CREATE POLICY receptionist_update_stock ON materials 
FOR UPDATE TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'RECEPTIONIST')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'RECEPTIONIST');

-- POLICIES FOR PATIENTS
CREATE POLICY admin_full_patients ON patients FOR ALL TO authenticated USING (TRUE);
CREATE POLICY staff_view_patients ON patients FOR SELECT TO authenticated USING (TRUE);
