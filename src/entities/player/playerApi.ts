import { getSupabaseClient } from '@/db/supabaseClient'

import type { InventoryEntry, LeaderboardEntry, PlayerSummary } from './playerTypes'

function mapPlayerSummary(row: {
  cheese_count: number
  cows: number
  fights_played: number
  fights_won: number
  nickname: string
  player_id: string
  starter_picks_completed: number
  unique_types: number
  win_rate: number
}): PlayerSummary {
  return {
    cheeseCount: row.cheese_count,
    cows: row.cows,
    fightsPlayed: row.fights_played,
    fightsWon: row.fights_won,
    id: row.player_id,
    nickname: row.nickname,
    starterPicksCompleted: row.starter_picks_completed,
    uniqueTypes: row.unique_types,
    winRate: row.win_rate,
  }
}

export async function createPlayer(nickname: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ nickname })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return getPlayerSummary(data.id)
}

export async function getPlayerSummary(playerId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('leaderboard_rows')
    .select('*')
    .eq('player_id', playerId)
    .single()

  if (error) {
    throw error
  }

  return mapPlayerSummary(data)
}

export async function getLeaderboard() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('leaderboard_rows')
    .select('*')
    .order('fights_won', { ascending: false })
    .order('win_rate', { ascending: false })
    .order('nickname', { ascending: true })

  if (error) {
    throw error
  }

  return data.map((row, index) => ({
    ...mapPlayerSummary(row),
    rank: index + 1,
  })) satisfies LeaderboardEntry[]
}

export async function getPlayerInventory(playerId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('player_inventory')
    .select('cheese_name, quantity')
    .eq('player_id', playerId)
    .gt('quantity', 0)
    .order('cheese_name', { ascending: true })

  if (error) {
    throw error
  }

  return data.map((row) => ({
    cheeseName: row.cheese_name,
    quantity: row.quantity,
  })) satisfies InventoryEntry[]
}

export async function getPlayerInventoryItem(playerId: string, cheeseName: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('player_inventory')
    .select('cheese_name, quantity')
    .eq('player_id', playerId)
    .eq('cheese_name', cheeseName)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    cheeseName: data.cheese_name,
    quantity: data.quantity,
  } satisfies InventoryEntry
}

export async function saveInventoryItem(playerId: string, cheeseName: string, quantity: number) {
  const supabase = getSupabaseClient()

  if (quantity <= 0) {
    const { error } = await supabase
      .from('player_inventory')
      .delete()
      .eq('player_id', playerId)
      .eq('cheese_name', cheeseName)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from('player_inventory').upsert({
    cheese_name: cheeseName,
    player_id: playerId,
    quantity,
  })

  if (error) {
    throw error
  }
}

export async function updatePlayerEconomy(playerId: string, cows: number, starterPicksCompleted: number) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('players')
    .update({
      cows,
      starter_picks_completed: starterPicksCompleted,
    })
    .eq('id', playerId)

  if (error) {
    throw error
  }
}

export async function updatePlayerFightRecord(playerId: string, fightsPlayed: number, fightsWon: number) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('players')
    .update({
      fights_played: fightsPlayed,
      fights_won: fightsWon,
    })
    .eq('id', playerId)

  if (error) {
    throw error
  }
}
