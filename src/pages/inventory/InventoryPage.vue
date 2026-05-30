<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import CheeseCard from '@/dumb/ui/CheeseCard.vue'
import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import { getPlayerInventory } from '@/entities/player/playerApi'
import type { InventoryEntry } from '@/entities/player/playerTypes'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const inventory = ref<InventoryEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

const { sessionState } = usePlayerSessionStore()

const inventoryCards = computed(() =>
  inventory.value
    .map((item) => ({
      cheese: getCheeseByName(item.cheeseName),
      quantity: item.quantity,
    }))
    .filter((item): item is { cheese: NonNullable<ReturnType<typeof getCheeseByName>>; quantity: number } => Boolean(item.cheese)),
)

async function loadInventory() {
  if (!sessionState.player) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    inventory.value = await getPlayerInventory(sessionState.player.id)
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
    <h1 class="text-2xl font-bold">Inventory</h1>

    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <p v-else-if="inventoryCards.length === 0" class="text-sm text-base-content/70">No cheese yet.</p>

    <div v-else class="grid grid-cols-2 gap-3">
      <div v-for="item in inventoryCards" :key="item.cheese.name" class="space-y-2">
        <CheeseCard :cheese="item.cheese" compact />
        <div class="text-center text-sm font-medium">x{{ item.quantity }}</div>
      </div>
    </div>
  </section>
</template>

