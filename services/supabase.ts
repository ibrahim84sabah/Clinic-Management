
import { createClient } from '@supabase/supabase-js';

/**
 * Default Supabase Credentials.
 * These act as fallbacks if environment variables are not set in the deployment dashboard.
 */
const SUPABASE_PROJECT_URL = 'https://kudsdhnrgbaccefyaovd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tpHII0KLsyu7EWqyVVbaYw_g6gRvJnC';

/**
 * Utility to fetch environment variables from various possible sources.
 */
const getEnv = (key: string, defaultValue: string): string => {
  try {
    // Access shimmed or injected process.env
    // @ts-ignore
    const env = (window.process && window.process.env) ? window.process.env : {};
    
    // Priorities: NEXT_PUBLIC_ (Vercel standard), VITE_ (Vite standard), raw key, then default
    const value = env[`NEXT_PUBLIC_${key}`] || 
                  env[`VITE_${key}`] || 
                  env[key] || 
                  defaultValue;
    
    return value ? value.trim() : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const url = getEnv('SUPABASE_URL', SUPABASE_PROJECT_URL);
const key = getEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

// Create the Supabase client
export const supabase = createClient(url, key);

/**
 * Simple connectivity check to verify that the Supabase keys are valid and the database is reachable.
 */
export const checkDbConnection = async () => {
  try {
    const { error } = await supabase.from('patients').select('id', { count: 'exact', head: true }).limit(1);
    
    if (error) {
      console.error("Supabase Connection Refused:", error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Critical Connection Error:", err);
    return false;
  }
};
