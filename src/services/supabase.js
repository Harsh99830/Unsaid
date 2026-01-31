import { createClient } from "@supabase/supabase-js";

const SUPABASE_SINGLETON_KEY = '__unsaidSupabaseClient__';

export const getSupabaseClient = () => {
  if (globalThis[SUPABASE_SINGLETON_KEY]) {
    return globalThis[SUPABASE_SINGLETON_KEY];
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce', // Prevents ghost sessions
      debug: process.env.NODE_ENV === 'development'
    },
    global: {
      headers: {
        'X-Client-Info': 'unsaid-app'
      }
    }
  });

  globalThis[SUPABASE_SINGLETON_KEY] = client;
  return client;
};

// Backward compatibility export
export const supabase = getSupabaseClient();
