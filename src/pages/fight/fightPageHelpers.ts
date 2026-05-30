import { getCheeseByName, type Cheese } from '@/entities/cheese/cheeseCatalog'
import type {
  Fight,
  FightLootRevealPayload,
  FightRoundOverviewPayload,
  FightRoundResolutionPayload,
} from '@/entities/fight/fightTypes'
import type { InventoryEntry } from '@/entities/player/playerTypes'

export interface SelectableFightCheese {
  cheese: Cheese
  instanceId: string
  quantityIndex: number
}

export function expandInventoryForFight(inventory: InventoryEntry[]) {
  return inventory.flatMap((entry) => {
    const cheese = getCheeseByName(entry.cheeseName)

    if (!cheese) {
      return []
    }

    return Array.from({ length: entry.quantity }, (_, index) => ({
      cheese,
      instanceId: `${entry.cheeseName}:${index + 1}`,
      quantityIndex: index + 1,
    })) satisfies SelectableFightCheese[]
  })
}

export function getFightRole(fight: Fight, playerId: string) {
  return fight.hostPlayerId === playerId ? 'host' : 'guest'
}

export function getOwnTeam(fight: Fight, role: 'guest' | 'host') {
  return role === 'host' ? fight.hostTeam : fight.guestTeam ?? []
}

export function getOpponentTeam(fight: Fight, role: 'guest' | 'host') {
  return role === 'host' ? fight.guestTeam ?? [] : fight.hostTeam
}

export function getUsedOwnIndexes(fight: Fight, role: 'guest' | 'host') {
  return role === 'host' ? fight.usedHostFighterIndexes : fight.usedGuestFighterIndexes
}

export function getUsedOpponentIndexes(fight: Fight, role: 'guest' | 'host') {
  return role === 'host' ? fight.usedGuestFighterIndexes : fight.usedHostFighterIndexes
}

export function isPhaseExpired(phaseEndsAt: string | null) {
  return Boolean(phaseEndsAt && new Date(phaseEndsAt).getTime() <= Date.now())
}

export function getPhaseRemainingMs(phaseEndsAt: string | null) {
  if (!phaseEndsAt) {
    return 0
  }

  return Math.max(0, new Date(phaseEndsAt).getTime() - Date.now())
}

export function pickRandomUnusedIndex(teamLength: number, usedIndexes: number[]) {
  const remainingIndexes = Array.from({ length: teamLength }, (_, index) => index).filter(
    (index) => !usedIndexes.includes(index),
  )

  if (remainingIndexes.length === 0) {
    return null
  }

  return remainingIndexes[Math.floor(Math.random() * remainingIndexes.length)] ?? null
}

export function buildRoundOverviewPayload(
  fight: Fight,
  hostFighterIndex: number,
  guestFighterIndex: number,
): FightRoundOverviewPayload {
  const hostCheese = getCheeseByName(fight.hostTeam[hostFighterIndex] ?? '')
  const guestCheese = getCheeseByName(fight.guestTeam?.[guestFighterIndex] ?? '')

  if (!hostCheese || !guestCheese) {
    throw new Error('Could not resolve fighters.')
  }

  return {
    guestCheeseName: guestCheese.name,
    guestFighterIndex,
    guestPower: guestCheese.power,
    hostCheeseName: hostCheese.name,
    hostFighterIndex,
    hostPower: hostCheese.power,
  }
}

export function buildRoundResolutionPayload(
  payload: FightRoundOverviewPayload,
  hostPlayerId: string,
  guestPlayerId: string,
): FightRoundResolutionPayload {
  const totalPower = Math.max(1, payload.hostPower + payload.guestPower)
  const hostShare = payload.hostPower / totalPower
  const guestShare = payload.guestPower / totalPower
  const rollPosition = Math.random()
  const winnerPlayerId = rollPosition <= hostShare ? hostPlayerId : guestPlayerId
  const winnerCheeseName =
    winnerPlayerId === hostPlayerId ? payload.hostCheeseName : payload.guestCheeseName
  const loserCheeseName =
    winnerPlayerId === hostPlayerId ? payload.guestCheeseName : payload.hostCheeseName

  return {
    ...payload,
    guestShare,
    hostShare,
    loserCheeseName,
    rollPosition,
    winnerCheeseName,
    winnerPlayerId,
  }
}

export function buildLootRevealPayload(
  fight: Fight,
  loserPlayerId: string,
): FightLootRevealPayload {
  const loserTeam = loserPlayerId === fight.hostPlayerId ? fight.hostTeam : fight.guestTeam ?? []
  const loserFighterIndex = Math.floor(Math.random() * loserTeam.length)
  const loserCheeseName = loserTeam[loserFighterIndex]

  if (!loserCheeseName) {
    throw new Error('Could not select the stolen cheese.')
  }

  return {
    loserCheeseName,
    loserFighterIndex,
  }
}

export function asRoundOverviewPayload(fight: Fight) {
  return fight.phasePayload as FightRoundOverviewPayload
}

export function asRoundResolutionPayload(fight: Fight) {
  return fight.phasePayload as FightRoundResolutionPayload
}

export function asLootRevealPayload(fight: Fight) {
  return fight.phasePayload as FightLootRevealPayload
}
