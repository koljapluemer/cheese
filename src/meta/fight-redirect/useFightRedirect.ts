import { watch } from 'vue'
import type { Router } from 'vue-router'

import { getActiveFightForPlayer, subscribeToPlayerFights } from '@/entities/fight/fightApi'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const blockedRouteNames = new Set(['choose-cheese', 'fight', 'name'])

export function useFightRedirect(router: Router) {
  const { sessionState } = usePlayerSessionStore()
  let unsubscribeFights: (() => void) | null = null

  async function maybeRedirectToFight() {
    const playerId = sessionState.player?.id
    const currentRouteName = String(router.currentRoute.value.name ?? '')

    if (!playerId || blockedRouteNames.has(currentRouteName)) {
      return
    }

    const activeFight = await getActiveFightForPlayer(playerId)

    if (activeFight) {
      await router.push({ name: 'fight' })
    }
  }

  watch(
    () => sessionState.player?.id,
    (playerId) => {
      unsubscribeFights?.()
      unsubscribeFights = null

      if (!playerId) {
        return
      }

      unsubscribeFights = subscribeToPlayerFights(playerId, ({ state }) => {
        if (state === 'completed') {
          return
        }

        void maybeRedirectToFight()
      })
      void maybeRedirectToFight()
    },
    { immediate: true },
  )

  return {
    dispose: () => {
      unsubscribeFights?.()
    },
  }
}
