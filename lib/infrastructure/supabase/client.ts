import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // Will generate DB types later, optional but good for safety

// Singleton pattern for browser client to avoid multiple instances
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// Helper to get typed supabase instance directly
export const supabaseBrowser = createClient();
