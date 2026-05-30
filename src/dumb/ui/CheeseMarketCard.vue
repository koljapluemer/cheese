<script setup lang="ts">
import { ChartNoAxesCombined, Info } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import CheesePriceHistoryChart from './CheesePriceHistoryChart.vue'
import CowAmount from './CowAmount.vue'
import PowerBadge from './PowerBadge.vue'

interface PriceHistoryPoint {
  buyPrice: number
  capturedAt: string
  cheeseName: string
  sellPrice: number
}

interface LastTradePrices {
  buyPrice: number | null
  sellPrice: number | null
}

const props = defineProps<{
  busy?: boolean
  buyDisabled?: boolean
  buyPrice?: number | null
  cheese: {
    imagePath: string
    license: string
    name: string
    power: number
    source: string
  }
  history?: PriceHistoryPoint[]
  lastTradePrices?: LastTradePrices
  ownedQuantity?: number
  sellDisabled?: boolean
  sellPrice?: number | null
}>()

defineEmits<{
  buy: [cheeseName: string]
  sell: [cheeseName: string]
}>()

const creditsModal = ref<HTMLDialogElement | null>(null)
const historyModal = ref<HTMLDialogElement | null>(null)

const hasHistory = computed(() => (props.history?.length ?? 0) > 0)

function openCreditsModal() {
  creditsModal.value?.showModal()
}

function openHistoryModal() {
  if (!hasHistory.value) {
    return
  }

  historyModal.value?.showModal()
}
</script>

<template>
  <article class="rounded-box border border-base-300 bg-base-100 p-3 shadow-sm">
    <div class="flex items-start gap-3">
      <div class="relative">
        <img
          :src="cheese.imagePath"
          :alt="cheese.name"
          class="size-20 shrink-0 rounded-box object-cover"
        />
        <div class="absolute bottom-1 right-1">
          <PowerBadge :power="cheese.power" small />
        </div>
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate font-medium">{{ cheese.name }}</h2>
            <p v-if="ownedQuantity !== undefined" class="text-xs text-base-content/60">
              You own {{ ownedQuantity }}
            </p>
          </div>

          <div class="flex shrink-0 gap-1">
            <button type="button" class="btn btn-ghost btn-xs btn-square" @click="openCreditsModal">
              <Info class="size-3.5" />
              <span class="sr-only">Credits</span>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square"
              :disabled="!hasHistory"
              @click="openHistoryModal"
            >
              <ChartNoAxesCombined class="size-3.5" />
              <span class="sr-only">Price history</span>
            </button>
          </div>
        </div>

        <p
          v-if="lastTradePrices && (lastTradePrices.buyPrice != null || lastTradePrices.sellPrice != null)"
          class="text-xs text-base-content/70"
        >
          Last buy:
          <template v-if="lastTradePrices.buyPrice != null">
            <CowAmount :value="lastTradePrices.buyPrice" />
          </template>
          <template v-else>none</template>
          · Last sell:
          <template v-if="lastTradePrices.sellPrice != null">
            <CowAmount :value="lastTradePrices.sellPrice" />
          </template>
          <template v-else>none</template>
        </p>

        <div v-if="buyPrice != null || sellPrice != null" class="flex gap-2">
          <button
            v-if="buyPrice != null"
            type="button"
            class="btn btn-sm btn-primary flex-1"
            :disabled="buyDisabled || busy"
            @click="$emit('buy', cheese.name)"
          >
            Buy
            <CowAmount :value="buyPrice" />
          </button>
          <button
            v-if="sellPrice != null"
            type="button"
            class="btn btn-sm flex-1"
            :disabled="sellDisabled || busy"
            @click="$emit('sell', cheese.name)"
          >
            Sell
            <CowAmount :value="sellPrice" />
          </button>
        </div>
      </div>
    </div>
  </article>

  <dialog ref="creditsModal" class="modal">
    <div class="modal-box space-y-3">
      <h3 class="text-lg font-semibold">{{ cheese.name }}</h3>
      <p class="text-sm text-base-content/70">Wikipedia contributors</p>
      <p class="text-sm">{{ cheese.license }}</p>
      <a class="link link-primary text-sm break-all" :href="cheese.source" rel="noreferrer" target="_blank">
        {{ cheese.source }}
      </a>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">close</button>
    </form>
  </dialog>

  <dialog ref="historyModal" class="modal">
    <div class="modal-box space-y-4">
      <div class="space-y-1">
        <h3 class="text-lg font-semibold">{{ cheese.name }}</h3>
        <p class="text-sm text-base-content/70">Trader buy and sell prices over time</p>
      </div>
      <CheesePriceHistoryChart v-if="history && history.length > 0" :history="history" />
      <p v-else class="text-sm text-base-content/70">No trader history yet.</p>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">close</button>
    </form>
  </dialog>
</template>
