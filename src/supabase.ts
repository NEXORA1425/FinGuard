import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const BUCKET_NAME = 'payment-documents';

// Helper to safely fetch environment variables without fallback leaks
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (_) {}
  return '';
};

// 1. Browser Public Client (Anon Key ONLY)
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// 2. Server-Side Admin Client (Service Role Key ONLY — NEVER fallback to anon key)
let cachedAdminClient: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (cachedAdminClient) return cachedAdminClient;

  const serverUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

  if (!serverUrl || !serviceRoleKey || serviceRoleKey.trim() === '' || serviceRoleKey.includes('YOUR_SUPABASE_SERVICE_ROLE_KEY')) {
    throw new Error('SERVER_CONFIG_ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing or unconfigured on the server.');
  }

  cachedAdminClient = createClient(serverUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
};
