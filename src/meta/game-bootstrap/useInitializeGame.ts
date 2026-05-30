import type { Router } from 'vue-router'

import { hydratePlayerSession, usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

export function useInitializeGame(router: Router) {
  const { sessionState } = usePlayerSessionStore()

  async function initialize() {
    const player = await hydratePlayerSession()

    if (!player) {
      if (router.currentRoute.value.name !== 'name') {
        await router.replace({ name: 'name' })
      }
      return
    }

    if (player.starterPicksCompleted < 3 && router.currentRoute.value.name !== 'choose-cheese') {
      await router.replace({ name: 'choose-cheese' })
      return
    }

    if (player.starterPicksCompleted === 3 && router.currentRoute.value.name === 'name') {
      await router.replace({ name: 'home' })
    }
  }

  return {
    initialize,
    sessionState,
  }
}
