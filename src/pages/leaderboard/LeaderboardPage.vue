<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { formatOrdinal } from '@/dumb/ui/formatters'
import { getLeaderboard } from '@/entities/player/playerApi'
import type { LeaderboardEntry } from '@/entities/player/playerTypes'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const leaderboard = ref<LeaderboardEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

const { sessionState } = usePlayerSessionStore()

const playerRank = computed(() => {
  const currentPlayerId = sessionState.player?.id

  if (!currentPlayerId) {
    return null
  }

  return leaderboard.value.find((entry) => entry.id === currentPlayerId)?.rank ?? null
})

async function loadLeaderboard() {
  isLoading.value = true
  loadError.value = ''

  try {
    leaderboard.value = await getLeaderboard()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load leaderboard.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => sessionState.revision,
  () => {
    void loadLeaderboard()
  },
)

onMounted(() => {
  void loadLeaderboard()
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">Leaderboard</h1>
      <p v-if="playerRank" class="text-sm text-base-content/70">
        You are {{ formatOrdinal(playerRank) }}. You probably want to
        <RouterLink class="link link-primary" :to="{ name: 'marketplace' }">buy more cheese</RouterLink>:
        <RouterLink class="link link-primary" :to="{ name: 'trader' }">Trader</RouterLink>
      </p>
    </div>

    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in leaderboard"
            :key="entry.id"
            :class="entry.id === sessionState.player?.id ? 'bg-primary/10' : ''"
          >
            <td>{{ entry.rank }}</td>
            <td class="space-y-1">
              <div class="font-medium">{{ entry.nickname }}</div>
              <div v-if="entry.rank === 1" class="badge badge-primary badge-sm">Cheese Mogul</div>
            </td>
            <td>{{ entry.score }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

