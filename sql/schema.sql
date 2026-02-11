
-- تفعيل إضافة توليد المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول المرضى
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] NOT NULL,
  address TEXT,
  age INTEGER,
  medical_history TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المواد والخدمات
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('SERVICE', 'CONSUMABLE')),
  selling_price DECIMAL(12, 2), -- للخدمات فقط
  cost_price DECIMAL(12, 2) NOT NULL, -- تكلفة الشراء أو تكلفة التشغيل
  stock_quantity INTEGER DEFAULT 0,
  order_limit INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'قطعة',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول المواعيد
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول الفواتير (الجلسات المالية)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id),
  doctor_commission_pct DECIMAL(5, 2) DEFAULT 0,
  total_gross_amount DECIMAL(12, 2) NOT NULL, -- المبلغ المدفوع من المريض
  external_fees DECIMAL(12, 2) DEFAULT 0, -- أي مصاريف خارجية مثل المعمل
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول استهلاك المواد (للربط بين الفاتورة والمخزون وتحليل الربح)
CREATE TABLE IF NOT EXISTS consumable_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  quantity INTEGER NOT NULL,
  cost_at_time DECIMAL(12, 2) NOT NULL, -- حفظ التكلفة في وقتها لضمان دقة التقارير القديمة
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. عرض تحليل أرباح الجلسات (Profit Analysis View)
-- يحسب صافي الربح = (المبلغ الإجمالي - تكلفة المواد المستهلكة - عمولة الطبيب)
CREATE OR REPLACE VIEW session_profit_analysis AS
SELECT 
  i.id AS invoice_id,
  i.created_at,
  p.name AS patient_name,
  i.total_gross_amount,
  COALESCE((
    SELECT SUM(cl.quantity * cl.cost_at_time) 
    FROM consumable_logs cl 
    WHERE cl.invoice_id = i.id
  ), 0) AS total_consumable_cost,
  (i.total_gross_amount * (i.doctor_commission_pct / 100)) AS doctor_commission_amount,
  (i.total_gross_amount - 
   COALESCE((SELECT SUM(cl.quantity * cl.cost_at_time) FROM consumable_logs cl WHERE cl.invoice_id = i.id), 0) - 
   (i.total_gross_amount * (i.doctor_commission_pct / 100))
  ) AS net_profit
FROM invoices i
JOIN patients p ON i.patient_id = p.id;

-- 7. تفعيل سياسات الأمان (Row Level Security)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_logs ENABLE ROW LEVEL SECURITY;

-- سياسات المواعيد: الجميع (المسجلين) يمكنهم الوصول
DROP POLICY IF EXISTS staff_all_appointments ON appointments;
CREATE POLICY staff_all_appointments ON appointments FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- سياسات المخزون: 
-- 1. الأدمن له كامل الصلاحيات
DROP POLICY IF EXISTS admin_full_access_materials ON materials;
CREATE POLICY admin_full_access_materials ON materials FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN');

-- 2. الباقي يمكنهم العرض فقط
DROP POLICY IF EXISTS staff_view_materials ON materials;
CREATE POLICY staff_view_materials ON materials FOR SELECT TO authenticated USING (TRUE);

-- سياسات المرضى: الجميع يمكنه العرض والإضافة
DROP POLICY IF EXISTS staff_manage_patients ON patients;
CREATE POLICY staff_manage_patients ON patients FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- سياسات المحاسبة: الأدمن فقط يرى الفواتير والتحليلات
DROP POLICY IF EXISTS admin_accounting_access ON invoices;
CREATE POLICY admin_accounting_access ON invoices FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN');

DROP POLICY IF EXISTS admin_consumable_logs_access ON consumable_logs;
CREATE POLICY admin_consumable_logs_access ON consumable_logs FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN');
