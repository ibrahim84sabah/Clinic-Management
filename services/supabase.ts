
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to avoid "required" errors during initialization.
// In Vercel, make sure to add SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables.
const supabaseUrl = (
  (typeof process !== 'undefined' && (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) || 
  'https://placeholder-project.supabase.co'
).trim();

const supabaseAnonKey = (
  (typeof process !== 'undefined' && (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
  'placeholder-anon-key'
).trim();

// Export the client. If placeholders are used, API calls will fail gracefully in the console rather than crashing the app mount.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
