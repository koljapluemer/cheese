<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import CheeseMarketCard from '@/dumb/ui/CheeseMarketCard.vue'
import { formatOrdinal, formatPercent } from '@/dumb/ui/formatters'
import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import { getLeaderboard, getPlayerInventory } from '@/entities/player/playerApi'
import type { InventoryEntry, LeaderboardEntry } from '@/entities/player/playerTypes'
import {
  getTraderPriceHistory,
  getTraderTradeEvents,
  type TraderPriceHistoryPoint,
  type TraderTradeEvent,
} from '@/entities/trader/traderApi'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const inventory = ref<InventoryEntry[]>([])
const leaderboard = ref<LeaderboardEntry[]>([])
const history = ref<TraderPriceHistoryPoint[]>([])
const tradeEvents = ref<TraderTradeEvent[]>([])
const isLoading = ref(true)
const loadError = ref('')

const { sessionState } = usePlayerSessionStore()

function historyFor(cheeseName: string) {
  return history.value.filter((point) => point.cheeseName === cheeseName)
}

function lastTradePricesFor(cheeseName: string) {
  let buyPrice: number | null = null
  let sellPrice: number | null = null

  for (const event of tradeEvents.value) {
    if (event.cheeseName !== cheeseName) {
      continue
    }

    if (event.tradeKind === 'buy') {
      buyPrice = event.price
      continue
    }

    sellPrice = event.price
  }

  return {
    buyPrice,
    sellPrice,
  }
}

const inventoryCards = computed(() =>
  inventory.value
    .map((item) => ({
      cheese: getCheeseByName(item.cheeseName),
      history: historyFor(item.cheeseName),
      lastTradePrices: lastTradePricesFor(item.cheeseName),
      quantity: item.quantity,
    }))
    .filter(
      (
        item,
      ): item is {
        cheese: NonNullable<ReturnType<typeof getCheeseByName>>
        history: TraderPriceHistoryPoint[]
        lastTradePrices: { buyPrice: number | null; sellPrice: number | null }
        quantity: number
      } => Boolean(item.cheese),
    ),
)

const playerRank = computed(() => {
  const playerId = sessionState.player?.id

  if (!playerId) {
    return null
  }

  return leaderboard.value.find((entry) => entry.id === playerId)?.rank ?? null
})

const inventoryCheeseNames = computed(() => inventory.value.map((item) => item.cheeseName))

async function loadHomePage() {
  if (!sessionState.player) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [nextInventory, nextLeaderboard] = await Promise.all([
      getPlayerInventory(sessionState.player.id),
      getLeaderboard(),
    ])

    inventory.value = nextInventory
    leaderboard.value = nextLeaderboard

    const [nextHistory, nextTradeEvents] = await Promise.all([
      getTraderPriceHistory(inventoryCheeseNames.value),
      getTraderTradeEvents(inventoryCheeseNames.value),
    ])

    history.value = nextHistory
    tradeEvents.value = nextTradeEvents
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load home.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => sessionState.revision,
  () => {
    void loadHomePage()
  },
)

onMounted(() => {
  void loadHomePage()
})
</script>

<template>
  <section class="space-y-4">
    <div class="stats stats-vertical border border-base-300 shadow-sm">
      <div class="stat">
        <div class="stat-title">Games won</div>
        <div class="stat-value text-3xl">{{ sessionState.player?.fightsWon ?? 0 }}</div>
      </div>

      <div class="stat">
        <div class="stat-title">Win rate</div>
        <div class="stat-value text-3xl">{{ formatPercent(sessionState.player?.winRate ?? 0) }}</div>
      </div>

      <div class="stat">
        <div class="stat-title">Current placement</div>
        <div class="stat-value text-3xl">
          {{ playerRank ? formatOrdinal(playerRank) : '-' }}
        </div>
        <div class="stat-desc">
          <RouterLink class="link link-primary" :to="{ name: 'leaderboard' }">Leaderboard</RouterLink>
        </div>
      </div>
    </div>

    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Home</h1>
      <p class="text-sm text-base-content/70">Your cheeses</p>
    </div>

    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <p v-else-if="inventoryCards.length === 0" class="text-sm text-base-content/70">No cheese yet.</p>

    <div v-else class="space-y-3">
      <CheeseMarketCard
        v-for="item in inventoryCards"
        :key="item.cheese.name"
        :cheese="item.cheese"
        :history="item.history"
        :last-trade-prices="item.lastTradePrices"
        :owned-quantity="item.quantity"
      />
    </div>
  </section>
</template>
