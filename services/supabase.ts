
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Environment Variable Detection for Supabase.
 * In Vercel, these are injected into process.env.
 */
const getEnv = (key: string): string => {
  // Use casting to 'any' for both process and import.meta to avoid TS errors
  // @ts-ignore
  const pEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  // @ts-ignore
  const mEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

  return pEnv[key] || pEnv[`NEXT_PUBLIC_${key}`] || mEnv[`VITE_${key}`] || mEnv[key] || '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// We use placeholders if variables are missing to prevent the app from crashing on start.
// App.tsx uses this to show a helpful setup screen instead of a white page.
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DentaGlow: Supabase credentials not found. Check Vercel Environment Variables.");
}
