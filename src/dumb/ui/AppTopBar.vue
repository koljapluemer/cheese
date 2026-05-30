<script setup lang="ts">
import CowAmount from './CowAmount.vue'

defineProps<{
  player: {
    cheeseCount: number
    cows: number
    nickname: string
  } | null
}>()
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
    <div class="navbar mx-auto max-w-sm px-4">
      <div class="flex-1">
        <span class="truncate text-base font-semibold">{{ player?.nickname }}</span>
      </div>
      <div class="flex items-center gap-3 text-sm font-medium">
        <CowAmount :value="player?.cows ?? 0" />
        <span>{{ player?.cheeseCount ?? 0 }} cheese</span>
      </div>
    </div>
  </header>
</template>

