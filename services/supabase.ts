
import { createClient } from '@supabase/supabase-js';

/**
 * دالة ذكية لجلب متغيرات البيئة في المتصفح.
 * تبحث عن المتغير بالاسم الصريح، أو ببادئة NEXT_PUBLIC_ (لـ Vercel/Next)
 * أو ببادئة VITE_ (لـ Vite).
 */
const getEnv = (key: string): string => {
  try {
    // محاولة الجلب من process.env (المعتاد في Vercel)
    // @ts-ignore
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    
    // الترتيب: الاسم الصريح -> بادئة Next -> بادئة Vite
    return env[key] || 
           env[`NEXT_PUBLIC_${key}`] || 
           env[`VITE_${key}`] || 
           // @ts-ignore
           (typeof window !== 'undefined' && window.process?.env?.[key]) ||
           '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// استخدام قيم افتراضية مؤقتة لمنع انهيار التطبيق، مع السماح لـ App.tsx بعرض شاشة التنبيه
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

// تسجيل الحالة في وحدة التحكم للمساعدة في التصحيح
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DentaGlow Status: Supabase configuration missing from environment.");
}
