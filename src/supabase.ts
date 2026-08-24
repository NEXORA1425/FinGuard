import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (_) {}
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', getEnvVar('SUPABASE_URL', 'https://tzfuaqvyzcptlsahvqoy.supabase.co'));
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_xCslxfCv-7zDywGsA91yxg_7vgBZV5f');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', supabaseAnonKey);

export const BUCKET_NAME = 'payment-documents';

// Client for Browser / Public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for Server-Side admin operations (bypasses RLS for secure bucket downloads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function verifyServerSupabaseConfig(): boolean {
  if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE')) {
    console.error('[SUPABASE_CONFIG_ERROR] SUPABASE_URL is missing or invalid.');
    return false;
  }
  if (!supabaseServiceRoleKey) {
    console.error('[SUPABASE_CONFIG_ERROR] SUPABASE_SERVICE_ROLE_KEY is missing.');
    return false;
  }
  return true;
}
