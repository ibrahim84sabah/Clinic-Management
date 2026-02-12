
-- 1. التأكد من وجود الإضافات اللازمة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. إنشاء أو تحديث جدول البروفايلات
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')),
  password_plain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء أو تحديث جدول المرضى
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] NOT NULL,
  address TEXT,
  age INTEGER,
  medical_history TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. إصلاح جدول المواعيد وحذف القيود القديمة المتعارضة
-- ملاحظة: نحذف القيد القديم المرتبط بجدول users الوهمي
DO $$ 
BEGIN
    -- حذف القيد القديم إذا وجد
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_id_fkey') THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_doctor_id_fkey;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- الربط الصحيح بجدول البروفايلات
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. الجداول الأخرى (Materials, Invoices)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('SERVICE', 'CONSUMABLE')),
  selling_price DECIMAL(12, 2), 
  cost_price DECIMAL(12, 2) NOT NULL, 
  stock_quantity INTEGER DEFAULT 0,
  order_limit INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'قطعة',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  doctor_commission_pct DECIMAL(5, 2) DEFAULT 0,
  total_gross_amount DECIMAL(12, 2) NOT NULL, 
  external_fees DECIMAL(12, 2) DEFAULT 0, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. تفعيل RLS وإنشاء السياسات بطريقة صحيحة (PostgreSQL Syntax)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات (نحذف الموجود أولاً لتجنب الأخطاء)
DROP POLICY IF EXISTS public_access_profiles ON profiles;
CREATE POLICY public_access_profiles ON profiles FOR ALL USING (TRUE);

DROP POLICY IF EXISTS public_access_patients ON patients;
CREATE POLICY public_access_patients ON patients FOR ALL USING (TRUE);

DROP POLICY IF EXISTS public_access_materials ON materials;
CREATE POLICY public_access_materials ON materials FOR ALL USING (TRUE);

DROP POLICY IF EXISTS public_access_appointments ON appointments;
CREATE POLICY public_access_appointments ON appointments FOR ALL USING (TRUE);

DROP POLICY IF EXISTS public_access_invoices ON invoices;
CREATE POLICY public_access_invoices ON invoices FOR ALL USING (TRUE);

-- 7. إضافة حساب المدير الافتراضي إذا لم يوجد
INSERT INTO profiles (username, name, role, password_plain)
SELECT 'admin', 'المدير العام', 'ADMIN', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'admin');
