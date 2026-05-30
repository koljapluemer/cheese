import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'
import { getSupabasePublicConfig, isSupabaseConfigured } from './supabaseConfig'

let supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  const { publishableKey, url } = getSupabasePublicConfig()

  supabaseClient = createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseClient
}
