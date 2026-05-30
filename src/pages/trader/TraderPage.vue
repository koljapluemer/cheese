<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { useToastStore } from '@/dumb/toast/toastStore'
import CowAmount from '@/dumb/ui/CowAmount.vue'
import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import { getPlayerInventory } from '@/entities/player/playerApi'
import type { InventoryEntry } from '@/entities/player/playerTypes'
import type { TraderPrice } from '@/entities/trader/traderApi'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'
import { buyTraderCheese, ensureTraderPricesFresh, sellTraderCheese } from '@/features/trader-manage/traderActions'

const { sessionState, setPlayerSession } = usePlayerSessionStore()
const { showToast } = useToastStore()

const search = ref('')
const inventory = ref<InventoryEntry[]>([])
const prices = ref<TraderPrice[]>([])
const isLoading = ref(true)
const loadError = ref('')
const busyCheeseName = ref('')

const visiblePrices = computed(() => {
  const normalizedSearch = search.value.trim().toLowerCase()

  return prices.value.filter((price) => price.cheeseName.toLowerCase().includes(normalizedSearch))
})

function quantityFor(cheeseName: string) {
  return inventory.value.find((item) => item.cheeseName === cheeseName)?.quantity ?? 0
}

async function loadTraderPage() {
  if (!sessionState.player) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [nextPrices, nextInventory] = await Promise.all([
      ensureTraderPricesFresh(),
      getPlayerInventory(sessionState.player.id),
    ])

    prices.value = nextPrices
    inventory.value = nextInventory
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load trader.'
  } finally {
    isLoading.value = false
  }
}

async function handleBuy(price: TraderPrice) {
  if (!sessionState.player || busyCheeseName.value) {
    return
  }

  busyCheeseName.value = price.cheeseName

  try {
    const player = await buyTraderCheese(sessionState.player.id, price)
    setPlayerSession(player)
    inventory.value = await getPlayerInventory(sessionState.player.id)
    showToast(`1 ${price.cheeseName} bought for ${price.buyPrice}.`, 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not buy cheese.', 'error')
  } finally {
    busyCheeseName.value = ''
  }
}

async function handleSell(price: TraderPrice) {
  if (!sessionState.player || busyCheeseName.value) {
    return
  }

  busyCheeseName.value = price.cheeseName

  try {
    const player = await sellTraderCheese(sessionState.player.id, price)
    setPlayerSession(player)
    inventory.value = await getPlayerInventory(sessionState.player.id)
    showToast(`1 ${price.cheeseName} sold for ${price.sellPrice}.`, 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not sell cheese.', 'error')
  } finally {
    busyCheeseName.value = ''
  }
}

onMounted(() => {
  void loadTraderPage()
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold">Trader</h1>
      <label class="input input-bordered flex items-center gap-2">
        <Search class="size-4 text-base-content/50" />
        <input v-model="search" type="text" class="grow" placeholder="Filter cheeses" />
      </label>
    </div>

    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="price in visiblePrices"
        :key="price.cheeseName"
        class="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3"
      >
        <img
          v-if="getCheeseByName(price.cheeseName)"
          :src="getCheeseByName(price.cheeseName)?.imagePath"
          :alt="price.cheeseName"
          class="size-14 rounded-box object-cover"
        />

        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ price.cheeseName }}</div>
          <div class="text-xs text-base-content/60">You own {{ quantityFor(price.cheeseName) }}</div>
        </div>

        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="busyCheeseName === price.cheeseName"
            @click="handleBuy(price)"
          >
            Buy
            <CowAmount :value="price.buyPrice" />
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :disabled="busyCheeseName === price.cheeseName || quantityFor(price.cheeseName) === 0"
            @click="handleSell(price)"
          >
            Sell
            <CowAmount :value="price.sellPrice" />
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

