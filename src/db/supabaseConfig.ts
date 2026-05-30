const missingValue = ''

export function getSupabasePublicConfig() {
  return {
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? missingValue,
    url: import.meta.env.VITE_SUPABASE_URL ?? missingValue,
  }
}

export function isSupabaseConfigured() {
  const { publishableKey, url } = getSupabasePublicConfig()

  return Boolean(url && publishableKey)
}
