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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://tzfuaqvyzcptlsahvqoy.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_xCslxfCv-7zDywGsA91yxg_7vgBZV5f');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', supabaseAnonKey);

// Client for Browser / Public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for Server-Side admin operations (bypasses RLS for secure bucket downloads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export const BUCKET_NAME = 'payment-documents';
