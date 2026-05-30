<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useToastStore } from '@/dumb/toast/toastStore'
import CheeseCard from '@/dumb/ui/CheeseCard.vue'
import { getRandomCheesePair, type Cheese } from '@/entities/cheese/cheeseCatalog'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'
import { pickStarterCheese } from '@/features/player-starter-pack/pickStarterCheese'

const router = useRouter()
const isSaving = ref(false)
const options = ref<Cheese[]>(getRandomCheesePair())

const { sessionState, setPlayerSession } = usePlayerSessionStore()
const { showToast } = useToastStore()

const picksCompleted = computed(() => sessionState.player?.starterPicksCompleted ?? 0)

function nextOptions() {
  options.value = getRandomCheesePair()
}

async function chooseCheese(cheeseName: string) {
  if (!sessionState.player || isSaving.value) {
    return
  }

  isSaving.value = true

  try {
    const player = await pickStarterCheese(sessionState.player.id, cheeseName)
    setPlayerSession(player)
    showToast(`1 ${cheeseName} added.`, 'success')

    if (player.starterPicksCompleted >= 3) {
      await router.replace({ name: 'home' })
      return
    }

    nextOptions()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not add cheese.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span>Pick {{ picksCompleted + 1 }} of 3</span>
        <span>{{ picksCompleted }}/3</span>
      </div>
      <progress class="progress progress-primary w-full" :value="picksCompleted" max="3"></progress>
    </div>

    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Which cheese do you want?</h1>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <CheeseCard
        v-for="cheese in options"
        :key="cheese.name"
        :cheese="cheese"
        @choose="chooseCheese"
      />
    </div>

    <div v-if="isSaving" class="flex justify-center">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  </section>
</template>
