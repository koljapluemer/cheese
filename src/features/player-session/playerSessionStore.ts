import { reactive, readonly } from 'vue'

import { getPlayerSummary } from '@/entities/player/playerApi'
import type { PlayerSummary } from '@/entities/player/playerTypes'

const storageKey = 'cheese-player-session'

interface StoredPlayerSession {
  nickname: string
  playerId: string
  starterPicksCompleted: number
}

const sessionState = reactive<{
  player: PlayerSummary | null
  revision: number
  status: 'idle' | 'loading' | 'missing' | 'ready'
}>({
  player: null,
  revision: 0,
  status: 'idle',
})

function saveStoredPlayerSession(player: PlayerSummary) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      nickname: player.nickname,
      playerId: player.id,
      starterPicksCompleted: player.starterPicksCompleted,
    }),
  )
}

export function getStoredPlayerSession(): StoredPlayerSession | null {
  const rawValue = localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredPlayerSession
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export async function hydratePlayerSession() {
  const storedSession = getStoredPlayerSession()

  if (!storedSession) {
    sessionState.player = null
    sessionState.status = 'missing'
    return null
  }

  sessionState.status = 'loading'

  try {
    const player = await getPlayerSummary(storedSession.playerId)
    sessionState.player = player
    sessionState.revision += 1
    sessionState.status = 'ready'
    saveStoredPlayerSession(player)
    return player
  } catch {
    clearPlayerSession()
    return null
  }
}

export function setPlayerSession(player: PlayerSummary) {
  sessionState.player = player
  sessionState.revision += 1
  sessionState.status = 'ready'
  saveStoredPlayerSession(player)
}

export function clearPlayerSession() {
  localStorage.removeItem(storageKey)
  sessionState.player = null
  sessionState.revision += 1
  sessionState.status = 'missing'
}

export function usePlayerSessionStore() {
  return {
    clearPlayerSession,
    hydratePlayerSession,
    sessionState: readonly(sessionState),
    setPlayerSession,
  }
}

