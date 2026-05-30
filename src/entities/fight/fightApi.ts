import type { Database } from '@/db/database.types'
import { getSupabaseClient } from '@/db/supabaseClient'

import type { Fight, FightOffer } from './fightTypes'

function mapFightOffer(row: Database['public']['Tables']['fight_offers']['Row']): FightOffer {
  return {
    acceptedByPlayerId: row.accepted_by_player_id,
    createdAt: row.created_at,
    hostNickname: row.host_nickname,
    hostPlayerId: row.host_player_id,
    hostTeam: row.host_team,
    id: row.id,
    status: row.status as FightOffer['status'],
    updatedAt: row.updated_at,
  }
}

function mapFight(row: Database['public']['Tables']['fights']['Row']): Fight {
  return {
    createdAt: row.created_at,
    guestNickname: row.guest_nickname,
    guestPlayerId: row.guest_player_id,
    guestPoints: row.guest_points,
    guestTeam: row.guest_team,
    hostNickname: row.host_nickname,
    hostPlayerId: row.host_player_id,
    hostPoints: row.host_points,
    hostTeam: row.host_team,
    id: row.id,
    loserPlayerId: row.loser_player_id,
    offerId: row.offer_id,
    phaseEndsAt: row.phase_ends_at,
    phasePayload: row.phase_payload as Fight['phasePayload'],
    phaseStartedAt: row.phase_started_at,
    state: row.state as Fight['state'],
    stolenCheeseName: row.stolen_cheese_name,
    updatedAt: row.updated_at,
    usedGuestFighterIndexes: row.used_guest_fighter_indexes,
    usedHostFighterIndexes: row.used_host_fighter_indexes,
    winnerPlayerId: row.winner_player_id,
  }
}

export async function getOwnOpenFightOffer(playerId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fight_offers')
    .select('*')
    .eq('host_player_id', playerId)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapFightOffer(data) : null
}

export async function getAvailableFightOffers(playerId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fight_offers')
    .select('*')
    .eq('status', 'open')
    .neq('host_player_id', playerId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data.map(mapFightOffer)
}

export async function getActiveFightForPlayer(playerId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .or(`host_player_id.eq.${playerId},guest_player_id.eq.${playerId}`)
    .neq('state', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapFight(data) : null
}

export async function getFightById(fightId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('fights').select('*').eq('id', fightId).single()

  if (error) {
    throw error
  }

  return mapFight(data)
}

export async function createFightOffer(input: {
  hostNickname: string
  hostPlayerId: string
  hostTeam: string[]
}) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fight_offers')
    .insert({
      host_nickname: input.hostNickname,
      host_player_id: input.hostPlayerId,
      host_team: input.hostTeam,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapFightOffer(data)
}

export async function cancelFightOffer(offerId: string, hostPlayerId: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('fight_offers')
    .update({ status: 'cancelled' })
    .eq('host_player_id', hostPlayerId)
    .eq('id', offerId)
    .eq('status', 'open')

  if (error) {
    throw error
  }
}

export async function acceptFightOffer(input: {
  guestNickname: string
  guestPlayerId: string
  offerId: string
}) {
  const supabase = getSupabaseClient()
  const { data: matchedOffer, error: matchError } = await supabase
    .from('fight_offers')
    .update({
      accepted_by_player_id: input.guestPlayerId,
      status: 'matched',
    })
    .eq('id', input.offerId)
    .eq('status', 'open')
    .neq('host_player_id', input.guestPlayerId)
    .select('*')
    .maybeSingle()

  if (matchError) {
    throw matchError
  }

  if (!matchedOffer) {
    throw new Error('This fight offer is gone.')
  }

  const { data: fight, error: fightError } = await supabase
    .from('fights')
    .insert({
      guest_nickname: input.guestNickname,
      guest_player_id: input.guestPlayerId,
      host_nickname: matchedOffer.host_nickname,
      host_player_id: matchedOffer.host_player_id,
      host_team: matchedOffer.host_team,
      offer_id: matchedOffer.id,
    })
    .select('*')
    .single()

  if (fightError) {
    throw fightError
  }

  return mapFight(fight)
}

export async function submitGuestFightTeam(fightId: string, guestPlayerId: string, guestTeam: string[]) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fights')
    .update({
      guest_team: guestTeam,
    })
    .eq('guest_player_id', guestPlayerId)
    .eq('id', fightId)
    .eq('state', 'waiting_for_guest_team')
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapFight(data)
}

export async function updateFightIfCurrent(
  fightId: string,
  expectedUpdatedAt: string,
  updates: Omit<Database['public']['Tables']['fights']['Update'], 'phase_payload' | 'state'> & {
    phase_payload?: Fight['phasePayload']
    state?: Fight['state']
  },
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fights')
    .update(updates as Database['public']['Tables']['fights']['Update'])
    .eq('id', fightId)
    .eq('updated_at', expectedUpdatedAt)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapFight(data) : null
}

export function subscribeToFightOffers(onChange: () => void) {
  const supabase = getSupabaseClient()
  const channel = supabase
    .channel(`fight-offers-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'fight_offers' }, () => {
      onChange()
    })
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToPlayerFights(
  playerId: string,
  onChange: (fight: { fightId: string; state: Fight['state'] }) => void,
) {
  const supabase = getSupabaseClient()

  const channel = supabase
    .channel(`player-fights-${playerId}-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', filter: `host_player_id=eq.${playerId}`, schema: 'public', table: 'fights' },
      (payload) => {
        const row = payload.new as Database['public']['Tables']['fights']['Row']

        if (!row?.id) {
          return
        }

        onChange({
          fightId: row.id,
          state: row.state as Fight['state'],
        })
      },
    )
    .on(
      'postgres_changes',
      { event: '*', filter: `guest_player_id=eq.${playerId}`, schema: 'public', table: 'fights' },
      (payload) => {
        const row = payload.new as Database['public']['Tables']['fights']['Row']

        if (!row?.id) {
          return
        }

        onChange({
          fightId: row.id,
          state: row.state as Fight['state'],
        })
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
