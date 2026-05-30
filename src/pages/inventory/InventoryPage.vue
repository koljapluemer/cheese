<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import CheeseMarketCard from '@/dumb/ui/CheeseMarketCard.vue'
import { getAllCheeses, getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import { getPlayerInventory } from '@/entities/player/playerApi'
import type { InventoryEntry } from '@/entities/player/playerTypes'
import {
  getTraderPriceHistory,
  getTraderTradeEvents,
  type TraderPriceHistoryPoint,
  type TraderTradeEvent,
} from '@/entities/trader/traderApi'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const inventory = ref<InventoryEntry[]>([])
const history = ref<TraderPriceHistoryPoint[]>([])
const tradeEvents = ref<TraderTradeEvent[]>([])
const isLoading = ref(true)
const loadError = ref('')
const totalCheeseCount = getAllCheeses().length

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

const inventoryCheeseNames = computed(() =>
  inventory.value.map((item) => item.cheeseName),
)

const ownedCheeseCount = computed(() => inventoryCards.value.length)

async function loadInventory() {
  if (!sessionState.player) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    inventory.value = await getPlayerInventory(sessionState.player.id)
    const [nextHistory, nextTradeEvents] = await Promise.all([
      getTraderPriceHistory(inventoryCheeseNames.value),
      getTraderTradeEvents(inventoryCheeseNames.value),
    ])
    history.value = nextHistory
    tradeEvents.value = nextTradeEvents
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load inventory.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => sessionState.revision,
  () => {
    void loadInventory()
  },
)

onMounted(() => {
  void loadInventory()
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">Inventory</h1>
      <div class="space-y-1">
        <p class="text-sm text-base-content/70">
          You own {{ ownedCheeseCount }}/{{ totalCheeseCount }} cheeses
        </p>
        <progress
          class="progress progress-primary w-full"
          :value="ownedCheeseCount"
          :max="totalCheeseCount"
        ></progress>
      </div>
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
