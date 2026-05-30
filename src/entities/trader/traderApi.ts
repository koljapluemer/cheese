import { getSupabaseClient } from '@/db/supabaseClient'

export interface TraderPrice {
  buyPrice: number
  cheeseName: string
  offerStartsAt: string
  sellPrice: number
  updatedAt: string
}

export async function getTraderPrices() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('trader_prices')
    .select('*')
    .order('cheese_name', { ascending: true })

  if (error) {
    throw error
  }

  return data.map((row) => ({
    buyPrice: row.buy_price,
    cheeseName: row.cheese_name,
    offerStartsAt: row.offer_starts_at,
    sellPrice: row.sell_price,
    updatedAt: row.updated_at,
  })) satisfies TraderPrice[]
}

export async function upsertTraderPrices(prices: TraderPrice[]) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('trader_prices').upsert(
    prices.map((price) => ({
      buy_price: price.buyPrice,
      cheese_name: price.cheeseName,
      offer_starts_at: price.offerStartsAt,
      sell_price: price.sellPrice,
      updated_at: price.updatedAt,
    })),
  )

  if (error) {
    throw error
  }
}

export async function deleteTraderPrices(cheeseNames: string[]) {
  if (cheeseNames.length === 0) {
    return
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('trader_prices').delete().in('cheese_name', cheeseNames)

  if (error) {
    throw error
  }
}
