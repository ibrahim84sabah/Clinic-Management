
import { createClient } from '@supabase/supabase-js';

// Fallback values in case env variables are missing
const SUPABASE_PROJECT_URL = 'https://kudsdhnrgbaccefyaovd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tpHII0KLsyu7EWqyVVbaYw_g6gRvJnC';

const getEnv = (key: string, defaultValue: string): string => {
  try {
    // @ts-ignore
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    return env[key] || env[`NEXT_PUBLIC_${key}`] || env[`VITE_${key}`] || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const url = getEnv('SUPABASE_URL', SUPABASE_PROJECT_URL);
const key = getEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

export const supabase = createClient(url, key);

export const checkDbConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
};
