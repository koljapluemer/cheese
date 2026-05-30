export type FightOfferStatus = 'cancelled' | 'matched' | 'open'

export type FightState =
  | 'completed'
  | 'loot_reveal'
  | 'round_overview'
  | 'round_resolution'
  | 'waiting_for_guest_team'

export interface FightOffer {
  acceptedByPlayerId: string | null
  createdAt: string
  hostNickname: string
  hostPlayerId: string
  hostTeam: string[]
  id: string
  status: FightOfferStatus
  updatedAt: string
}

export interface FightRoundOverviewPayload {
  guestCheeseName: string
  guestFighterIndex: number
  guestPower: number
  hostCheeseName: string
  hostFighterIndex: number
  hostPower: number
}

export interface FightRoundResolutionPayload extends FightRoundOverviewPayload {
  guestShare: number
  hostShare: number
  loserCheeseName: string
  rollPosition: number
  winnerCheeseName: string
  winnerPlayerId: string
}

export interface FightLootRevealPayload {
  loserCheeseName: string
  loserFighterIndex: number
}

export type FightPhasePayload =
  | FightLootRevealPayload
  | FightRoundOverviewPayload
  | FightRoundResolutionPayload
  | Record<string, never>

export interface Fight {
  createdAt: string
  guestNickname: string
  guestPlayerId: string
  guestPoints: number
  guestTeam: string[] | null
  hostNickname: string
  hostPlayerId: string
  hostPoints: number
  hostTeam: string[]
  id: string
  loserPlayerId: string | null
  offerId: string
  phaseEndsAt: string | null
  phasePayload: FightPhasePayload
  phaseStartedAt: string | null
  state: FightState
  stolenCheeseName: string | null
  updatedAt: string
  usedGuestFighterIndexes: number[]
  usedHostFighterIndexes: number[]
  winnerPlayerId: string | null
}
