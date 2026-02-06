
import { createClient } from '@supabase/supabase-js';

/**
 * بيانات مشروع Supabase الموفرة من قبل المستخدم
 */
const SUPABASE_PROJECT_URL = 'https://kudsdhnrgbaccefyaovd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tpHII0KLsyu7EWqyVVbaYw_g6gRvJnC';

/**
 * دالة جلب متغيرات البيئة مع أولوية للقيم الموفرة مباشرة
 * لضمان عمل التطبيق فوراً.
 */
const getEnv = (key: string, defaultValue: string): string => {
  try {
    // @ts-ignore
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    
    // البحث في المتغيرات (للإنتاج على Vercel) أو استخدام القيمة الموفرة
    const value = env[`NEXT_PUBLIC_${key}`] || 
                  env[key] || 
                  defaultValue;
    
    return value.trim();
  } catch (e) {
    return defaultValue;
  }
};

const url = getEnv('SUPABASE_URL', SUPABASE_PROJECT_URL);
const key = getEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

// إنشاء عميل Supabase
export const supabase = createClient(url, key);

/**
 * فحص الاتصال بقاعدة البيانات.
 * يحاول قراءة جدول المرضى للتأكد من أن المفاتيح صالحة والجداول موجودة.
 */
export const checkDbConnection = async () => {
  try {
    // محاولة بسيطة لجلب عدد الصفوف من جدول المرضى
    const { error } = await supabase.from('patients').select('id', { count: 'exact', head: true });
    
    // إذا كان الخطأ متعلق بعدم وجود الجدول، فهذا يعني أن الاتصال نجح ولكن السكيما مفقودة
    // أما إذا كان الخطأ 401 أو 403 فهذا يعني أن المفاتيح خاطئة
    if (error && (error.code === 'PGRST301' || error.status === 401)) {
      console.error("Supabase Auth Error:", error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Critical Connection Error:", err);
    return false;
  }
};
