<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useToastStore } from '@/dumb/toast/toastStore'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'
import { registerPlayerName } from '@/features/player-sign-up/registerPlayerName'

const nickname = ref('')
const isSubmitting = ref(false)
const route = useRoute()
const router = useRouter()

const invite = typeof route.query.invite === 'string' ? route.query.invite : undefined

const { setPlayerSession } = usePlayerSessionStore()
const { showToast } = useToastStore()

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    if ('code' in error && error.code === '23505') {
      return 'That name is taken.'
    }

    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Could not create player.'
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const player = await registerPlayerName(nickname.value)
    setPlayerSession(player)
    showToast(`${player.nickname} joined the fight.`, 'success')
    await router.replace({ name: 'choose-cheese', query: invite ? { invite } : {} })
  } catch (error) {
    showToast(getErrorMessage(error), 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="flex min-h-[70vh] items-center">
    <div class="w-full space-y-6">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold leading-tight">
          You're about to enter the fight to become the Cheese Mogul.
        </h1>
        <p class="text-base text-base-content/70">What should we call you?</p>
      </div>

      <form class="space-y-3" @submit.prevent="handleSubmit">
        <label class="form-control w-full">
          <span class="label-text">Your name</span>
          <input
            v-model="nickname"
            type="text"
            maxlength="24"
            autocomplete="nickname"
            class="input input-bordered w-full"
            placeholder="Your name"
          />
        </label>

        <button type="submit" class="btn btn-primary w-full" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span v-else>Confirm</span>
        </button>
      </form>
    </div>
  </section>
</template>
