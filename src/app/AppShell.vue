<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import ToastOutlet from '@/dumb/toast/ToastOutlet.vue'
import AppBottomNav from '@/dumb/ui/AppBottomNav.vue'
import AppTopBar from '@/dumb/ui/AppTopBar.vue'
import { useInitializeGame } from '@/meta/game-bootstrap/useInitializeGame'

const route = useRoute()
const router = useRouter()

const { initialize, sessionState } = useInitializeGame(router)

const showTopBar = computed(() => Boolean(route.meta.showTopBar && sessionState.player))
const showBottomNav = computed(
  () => Boolean(route.meta.showBottomNav && sessionState.player?.starterPicksCompleted === 3),
)
const isLoading = computed(() => sessionState.status === 'loading' && route.name !== 'name')

onMounted(() => {
  void initialize()
})
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content">
    <AppTopBar v-if="showTopBar" :player="sessionState.player" />

    <main class="mx-auto min-h-screen w-full max-w-sm px-4 pb-24 pt-4">
      <div v-if="isLoading" class="flex min-h-[50vh] items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <RouterView v-else />
    </main>

    <AppBottomNav v-if="showBottomNav" />
    <ToastOutlet />
  </div>
</template>
