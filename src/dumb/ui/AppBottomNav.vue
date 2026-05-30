<script setup lang="ts">
import { Disc3, HandCoins, House, Package, RotateCcw, Store, Trophy } from 'lucide-vue-next'
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
  { icon: Trophy, name: 'score', label: 'Score' },
])
</script>

<template>
  <nav class="btm-nav btm-nav-sm z-30 border-t border-base-300 bg-base-100">
    <button
      v-for="item in items"
      :key="item.name"
      type="button"
      :class="route.name === item.name ? 'active text-primary' : ''"
      @click="router.push({ name: item.name })"
    >
      <component :is="item.icon" class="size-5" />
      <span class="sr-only">{{ item.label }}</span>
    </button>
  </nav>
</template>
