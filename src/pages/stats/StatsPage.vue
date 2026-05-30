<script setup lang="ts">
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

const { sessionState } = usePlayerSessionStore()
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-bold">Stats</h1>

    <div class="stats stats-vertical border border-base-300 shadow-sm">
      <div class="stat">
        <div class="stat-title">Number of cheeses</div>
        <div class="stat-value text-3xl">{{ sessionState.player?.cheeseCount ?? 0 }}</div>
        <div class="stat-desc">x1 in score</div>
      </div>

      <div class="stat">
        <div class="stat-title">Unique cheese types</div>
        <div class="stat-value text-3xl">{{ sessionState.player?.uniqueTypes ?? 0 }}</div>
        <div class="stat-desc">x5 in score</div>
      </div>

      <div class="stat">
        <div class="stat-title">Final score</div>
        <div class="stat-value text-3xl">{{ sessionState.player?.score ?? 0 }}</div>
        <div class="stat-desc">
          {{ sessionState.player?.cheeseCount ?? 0 }} + ({{ sessionState.player?.uniqueTypes ?? 0 }} × 5)
        </div>
      </div>
    </div>
  </section>
</template>

