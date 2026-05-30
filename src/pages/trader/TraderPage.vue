<script setup lang="ts">
import { RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { useToastStore } from '@/dumb/toast/toastStore'
import CowAmount from '@/dumb/ui/CowAmount.vue'
import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import { getPlayerInventory } from '@/entities/player/playerApi'
import type { InventoryEntry } from '@/entities/player/playerTypes'
import type { TraderPrice } from '@/entities/trader/traderApi'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'
import {
  buyTraderCheese,
  ensureTraderPricesFresh,
  sellTraderCheese,
  TRADER_REFRESH_INTERVAL_MS,
} from '@/features/trader-manage/traderActions'

const { sessionState, setPlayerSession } = usePlayerSessionStore()
const { showToast } = useToastStore()

const search = ref('')
const onlyOwned = ref(false)
const inventory = ref<InventoryEntry[]>([])
const prices = ref<TraderPrice[]>([])
const isLoading = ref(true)
const loadError = ref('')
const busyCheeseName = ref('')
const currentTime = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null

function quantityFor(cheeseName: string) {
  return inventory.value.find((item) => item.cheeseName === cheeseName)?.quantity ?? 0
}

function replacePrice(updatedPrice: TraderPrice) {
  prices.value = prices.value.map((price) =>
    price.cheeseName === updatedPrice.cheeseName ? updatedPrice : price,
  )
}

const visiblePrices = computed(() => {
  const normalizedSearch = search.value.trim().toLowerCase()

  return prices.value.filter((price) => {
    if (!price.cheeseName.toLowerCase().includes(normalizedSearch)) {
      return false
    }

    if (onlyOwned.value && quantityFor(price.cheeseName) === 0) {
      return false
    }

    return true
  })
})

const offerRefreshDeadline = computed(() => {
  const offerStartsAt = prices.value[0]?.offerStartsAt

  if (!offerStartsAt) {
    return null
  }

  return new Date(offerStartsAt).getTime() + TRADER_REFRESH_INTERVAL_MS
})

const remainingSeconds = computed(() => {
  if (!offerRefreshDeadline.value) {
    return 0
  }

  return Math.max(0, Math.ceil((offerRefreshDeadline.value - currentTime.value) / 1000))
})

const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

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

async function handleRefreshOffers() {
  if (isLoading.value || busyCheeseName.value) {
    return
  }

  await loadTraderPage()
}

async function handleBuy(price: TraderPrice) {
  if (!sessionState.player || busyCheeseName.value) {
    return
  }

  busyCheeseName.value = price.cheeseName

  try {
    const { player, tradedPrice, updatedPrice } = await buyTraderCheese(sessionState.player.id, price)
    setPlayerSession(player)
    replacePrice(updatedPrice)
    inventory.value = await getPlayerInventory(sessionState.player.id)
    showToast(`1 ${price.cheeseName} bought for ${tradedPrice}.`, 'success')
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
    const { player, tradedPrice, updatedPrice } = await sellTraderCheese(sessionState.player.id, price)
    setPlayerSession(player)
    replacePrice(updatedPrice)
    inventory.value = await getPlayerInventory(sessionState.player.id)
    showToast(`1 ${price.cheeseName} sold for ${tradedPrice}.`, 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not sell cheese.', 'error')
  } finally {
    busyCheeseName.value = ''
  }
}

onMounted(() => {
  countdownTimer = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
  void loadTraderPage()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-3">
      <h1 class="text-2xl font-bold">Trader</h1>
      <div class="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-3 py-2">
        <span class="text-sm text-base-content/70">
          <template v-if="prices.length && remainingSeconds > 0">
            New offers in {{ formattedRemainingTime }}
          </template>
          <template v-else-if="prices.length">New offers ready</template>
          <template v-else>Loading offers</template>
        </span>
        <button
          v-if="prices.length && remainingSeconds === 0"
          type="button"
          class="btn btn-ghost btn-sm btn-square"
          :disabled="isLoading || Boolean(busyCheeseName)"
          @click="handleRefreshOffers"
        >
          <RefreshCw class="size-4" />
          <span class="sr-only">Refresh offers</span>
        </button>
      </div>
      <label class="input input-bordered flex items-center gap-2">
        <Search class="size-4 text-base-content/50" />
        <input v-model="search" type="text" class="grow" placeholder="Filter cheeses" />
      </label>
      <label class="label flex cursor-pointer justify-start gap-3">
        <input v-model="onlyOwned" type="checkbox" class="checkbox checkbox-sm" />
        <span class="label-text">Only cheeses I own</span>
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
