import { getSupabaseClient } from '@/db/supabaseClient'

export interface TraderPrice {
  buyPrice: number
  cheeseName: string
  offerStartsAt: string
  sellPrice: number
  updatedAt: string
}

export interface TraderPriceHistoryPoint {
  buyPrice: number
  capturedAt: string
  cheeseName: string
  sellPrice: number
}

export interface TraderTradeEvent {
  cheeseName: string
  price: number
  tradeKind: 'buy' | 'sell'
  tradedAt: string
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

export async function getTraderPriceHistory(cheeseNames?: string[]) {
  if (cheeseNames && cheeseNames.length === 0) {
    return []
  }

  const supabase = getSupabaseClient()
  let query = supabase
    .from('trader_price_history')
    .select('*')
    .order('captured_at', { ascending: true })

  if (cheeseNames && cheeseNames.length > 0) {
    query = query.in('cheese_name', cheeseNames)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data.map((row) => ({
    buyPrice: row.buy_price,
    cheeseName: row.cheese_name,
    sellPrice: row.sell_price,
    capturedAt: row.captured_at,
  })) satisfies TraderPriceHistoryPoint[]
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

export async function recordTraderPriceHistory(prices: TraderPrice[]) {
  if (prices.length === 0) {
    return
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('trader_price_history').insert(
    prices.map((price) => ({
      buy_price: price.buyPrice,
      captured_at: price.updatedAt,
      cheese_name: price.cheeseName,
      sell_price: price.sellPrice,
    })),
  )

  if (error) {
    throw error
  }
}

export async function getTraderTradeEvents(cheeseNames?: string[]) {
  if (cheeseNames && cheeseNames.length === 0) {
    return []
  }

  const supabase = getSupabaseClient()
  let query = supabase
    .from('trader_trade_events')
    .select('*')
    .order('traded_at', { ascending: true })

  if (cheeseNames && cheeseNames.length > 0) {
    query = query.in('cheese_name', cheeseNames)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data.map((row) => ({
    cheeseName: row.cheese_name,
    price: row.price,
    tradeKind: row.trade_kind as 'buy' | 'sell',
    tradedAt: row.traded_at,
  })) satisfies TraderTradeEvent[]
}

export async function recordTraderTradeEvent(event: TraderTradeEvent) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('trader_trade_events').insert({
    cheese_name: event.cheeseName,
    price: event.price,
    trade_kind: event.tradeKind,
    traded_at: event.tradedAt,
  })

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
