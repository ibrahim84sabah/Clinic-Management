import { createClient } from '@supabase/supabase-js';

/**
 * Robust Environment Variable Detection
 * Supports:
 * - process.env (Standard Node/Vercel)
 * - import.meta.env (Vite)
 * - NEXT_PUBLIC_ prefixes (Standard Vercel/Next.js for browser injection)
 * - VITE_ prefixes (Standard Vite for browser injection)
 */
const getEnv = (key: string): string => {
  const providers = [
    // @ts-ignore
    () => typeof process !== 'undefined' && process.env ? process.env[key] : null,
    // @ts-ignore
    () => typeof process !== 'undefined' && process.env ? process.env[`NEXT_PUBLIC_${key}`] : null,
    // @ts-ignore
    () => typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : null,
    // @ts-ignore
    () => typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[`VITE_${key}`] : null,
    // @ts-ignore
    () => typeof window !== 'undefined' && (window as any)._env_ ? (window as any)._env_[key] : null
  ];

  for (const get of providers) {
    try {
      const val = get();
      if (val) return val;
    } catch (e) {}
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Use placeholders to prevent createClient from throwing an error during initialization
// App.tsx handles the visual warning for the user if these are placeholders
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

// Log status for developers
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "DentaGlow: Supabase credentials not detected in environment. " +
    "Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your hosting provider (Vercel/Netlify)."
  );
}
