
import { createClient } from '@supabase/supabase-js';

/**
 * دالة ذكية وشاملة لجلب متغيرات البيئة.
 * صُممت لتعمل في بيئات البناء المختلفة (Vite, Next, Vercel).
 */
const getEnv = (key: string): string => {
  try {
    // 1. البحث في process.env التقليدي (Node/Vercel)
    // @ts-ignore
    const pEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
    
    // 2. البحث في window.process.env (في حال وجود Shim)
    // @ts-ignore
    const wEnv = (typeof window !== 'undefined' && (window as any).process?.env) ? (window as any).process.env : {};

    // 3. الترتيب المفضل للجلب
    return pEnv[`NEXT_PUBLIC_${key}`] || 
           pEnv[key] || 
           wEnv[`NEXT_PUBLIC_${key}`] || 
           wEnv[key] || 
           '';
  } catch (e) {
    console.error(`Error accessing env var ${key}:`, e);
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// نستخدم قيم "Placeholder" فقط لتجنب انهيار التطبيق، 
// App.tsx سيتعرف عليها ويعرض شاشة التكوين بدلاً من شاشة بيضاء.
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DentaGlow: Supabase variables are missing. Current detected URL:", supabaseUrl ? "Found" : "Missing");
}
