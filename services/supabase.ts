
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Environment Variable Retrieval
 * Specifically handles Vercel injected variables in a browser environment.
 */
const getEnv = (key: string): string => {
  try {
    // Check standard process.env (Vercel/Node style)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    
    // Check window.process.env (Common shim style)
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      // @ts-ignore
      return (window as any).process.env[key];
    }

    // Check for NEXT_PUBLIC or VITE prefixes just in case the bundler renamed them
    // @ts-ignore
    const pEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
    if (pEnv[`NEXT_PUBLIC_${key}`]) return pEnv[`NEXT_PUBLIC_${key}`];
    if (pEnv[`VITE_${key}`]) return pEnv[`VITE_${key}`];

  } catch (e) {
    console.error(`Error reading env var ${key}:`, e);
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// We use these values if available, otherwise fall back to placeholders 
// so the UI can show the configuration warning instead of crashing.
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DentaGlow: Supabase variables (SUPABASE_URL, SUPABASE_ANON_KEY) are currently missing from the environment.");
}
