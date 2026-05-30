<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { useToastStore } from '@/dumb/toast/toastStore'
import { usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

import WheelSpinner from './WheelSpinner.vue'
import { applyWheelReward, generateWheelSegments, pickWinningSegment } from './wheelActions'
import { getWinningRotationDegrees } from './wheelGeometry'
import {
  commitWheelResult,
  createStoredWheelState,
  getWheelSlot,
  markWheelRewardApplied,
  readStoredWheelState,
  writeStoredWheelState,
} from './wheelState'
import type { StoredWheelState } from './wheelTypes'

const SPIN_DURATION_MS = 4200

const { sessionState, setPlayerSession } = usePlayerSessionStore()
const { showToast } = useToastStore()

const currentTime = ref(Date.now())
const isLoading = ref(true)
const isSpinning = ref(false)
const loadError = ref('')
const rotationDegrees = ref(0)
const wheelState = ref<StoredWheelState | null>(null)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const nextSlotCountdown = computed(() => {
  if (!wheelState.value?.spent) {
    return ''
  }

  const remainingMs = Math.max(0, wheelState.value.slotEndMs - currentTime.value)
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const canSpin = computed(() => Boolean(wheelState.value && !wheelState.value.spent && !isSpinning.value))

function getCurrentPlayerId() {
  return sessionState.player?.id ?? null
}

async function finalizeRewardIfNeeded(state: StoredWheelState) {
  if (!state.spent || state.rewardApplied || !state.winningSegmentId) {
    return state
  }

  const playerId = getCurrentPlayerId()

  if (!playerId) {
    return state
  }

  const winningSegment = state.segments.find((segment) => segment.id === state.winningSegmentId)

  if (!winningSegment) {
    return state
  }

  const rewardResult = await applyWheelReward(playerId, winningSegment)
  setPlayerSession(rewardResult.player)
  showToast(rewardResult.toastMessage, rewardResult.toastTone)

  const resolvedState = markWheelRewardApplied(state)
  writeStoredWheelState(resolvedState)
  return resolvedState
}

async function loadWheelState() {
  const playerId = getCurrentPlayerId()

  if (!playerId) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const slot = getWheelSlot(currentTime.value)
    const storedState = readStoredWheelState(playerId, slot.slotStartMs)
    const nextState =
      storedState ??
      createStoredWheelState(playerId, slot, await generateWheelSegments())
    const persistedState = storedState ?? nextState

    if (!storedState) {
      writeStoredWheelState(nextState)
    }

    const resolvedState = await finalizeRewardIfNeeded(persistedState)
    wheelState.value = resolvedState
    rotationDegrees.value =
      resolvedState.spent && resolvedState.winningSegmentId
        ? getWinningRotationDegrees(resolvedState.segments, resolvedState.winningSegmentId)
        : 0
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load wheel.'
  } finally {
    isLoading.value = false
  }
}

async function handleSpin() {
  if (!wheelState.value || !canSpin.value) {
    return
  }

  const winningSegment = pickWinningSegment(wheelState.value.segments)
  const committedState = commitWheelResult(wheelState.value, winningSegment.id)
  const finalRotation = getWinningRotationDegrees(committedState.segments, winningSegment.id)

  writeStoredWheelState(committedState)
  wheelState.value = committedState
  isSpinning.value = true
  rotationDegrees.value = 360 * 6 + finalRotation

  window.setTimeout(async () => {
    try {
      const resolvedState = await finalizeRewardIfNeeded(committedState)
      wheelState.value = resolvedState
      rotationDegrees.value = finalRotation
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not resolve spin.', 'error')
    } finally {
      isSpinning.value = false
    }
  }, SPIN_DURATION_MS)
}

function tickWheelClock() {
  currentTime.value = Date.now()

  if (isLoading.value || isSpinning.value || !wheelState.value) {
    return
  }

  if (currentTime.value >= wheelState.value.slotEndMs) {
    void loadWheelState()
  }
}

onMounted(() => {
  countdownTimer = window.setInterval(tickWheelClock, 1000)
  void loadWheelState()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Wheel</h1>
      <p class="text-sm text-base-content/70">One spin every 10 minutes.</p>
    </div>

    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="wheelState" class="space-y-4">
      <WheelSpinner
        :is-spinning="isSpinning"
        :rotation-degrees="rotationDegrees"
        :segments="wheelState.segments"
      />

      <div v-if="canSpin" class="space-y-3">
        <button type="button" class="btn btn-primary btn-block btn-lg" :disabled="isSpinning" @click="handleSpin">
          Spin
        </button>
      </div>

      <div v-else class="rounded-box border border-base-300 bg-base-100 px-4 py-3 text-center text-sm font-medium">
        <template v-if="isSpinning">Spinning...</template>
        <template v-else>Spin again in {{ nextSlotCountdown }}</template>
      </div>
    </div>
  </section>
</template>
