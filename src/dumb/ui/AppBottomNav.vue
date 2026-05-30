<script setup lang="ts">
import { Disc3, HandCoins, House, Package, RotateCcw, Store } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = computed(() => [
  { icon: House, name: 'leaderboard', label: 'Home' },
  { icon: Package, name: 'inventory', label: 'Inventory' },
  { icon: HandCoins, name: 'offers', label: 'Offers' },
  { icon: Store, name: 'marketplace', label: 'Marketplace' },
  { icon: RotateCcw, name: 'trader', label: 'Trader' },
  { icon: Disc3, name: 'wheel', label: 'Wheel' },
])
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100/95 backdrop-blur">
    <div
      class="mx-auto flex h-16 w-full max-w-sm items-stretch px-2"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="flex flex-1 items-center justify-center rounded-none text-base-content/60 transition-colors"
        :class="route.name === item.name ? 'text-primary' : 'hover:text-base-content'"
        @click="router.push({ name: item.name })"
      >
        <component :is="item.icon" class="size-5" />
        <span class="sr-only">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
