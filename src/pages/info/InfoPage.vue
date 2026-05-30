<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { getStoredPlayerSession } from '@/features/player-session/playerSessionStore'

const route = useRoute()
const router = useRouter()

const hasSession = Boolean(getStoredPlayerSession())
const invite = typeof route.query.invite === 'string' ? route.query.invite : undefined

function handleGetStarted() {
  if (hasSession) {
    void router.push({ name: 'home' })
  } else {
    void router.push({ name: 'name', query: invite ? { invite } : {} })
  }
}
</script>

<template>
  <section class="flex min-h-[80vh] flex-col justify-between">
    <div class="space-y-8 pt-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">Cheese Mogul</h1>
        <p class="text-base-content/60">The fight for cheese supremacy.</p>
      </div>

      <ul class="space-y-4">
        <li class="flex gap-3">
          <span class="mt-0.5 text-xl">🧀</span>
          <span>Pick your cheese fighter team</span>
        </li>
        <li class="flex gap-3">
          <span class="mt-0.5 text-xl">💰</span>
          <span>Buy and sell cheese to make your cheese team even better</span>
        </li>
        <li class="flex gap-3">
          <span class="mt-0.5 text-xl">⚔️</span>
          <span>Pick your fighters and auto-battle other players</span>
        </li>
        <li class="flex gap-3">
          <span class="mt-0.5 text-xl">🥷🏻</span>
          <span>Careful! The winning player steals a cheese from the other</span>
        </li>
        
        <li class="flex gap-3">
          <span class="mt-0.5 text-xl">🏆</span>
          <span>Win the most fights and become the Cheese Mogul</span>
        </li>
      </ul>
    </div>

    <button type="button" class="btn btn-primary btn-block btn-lg" @click="handleGetStarted">
      {{ hasSession ? 'Back to game' : 'Get started' }}
    </button>
  </section>
</template>
