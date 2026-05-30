<script setup lang="ts">
import { computed } from 'vue'

import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import type { Fight } from '@/entities/fight/fightTypes'

import FightCheeseCard from './FightCheeseCard.vue'
import {
  asLootRevealPayload,
  asRoundOverviewPayload,
  asRoundResolutionPayload,
  getFightRole,
  getOpponentTeam,
  getOwnTeam,
  getUsedOpponentIndexes,
  getUsedOwnIndexes,
} from './fightPageHelpers'

const props = defineProps<{
  fight: Fight
  now: number
  playerId: string
}>()

const role = computed(() => getFightRole(props.fight, props.playerId))
const ownName = computed(() =>
  role.value === 'host' ? props.fight.hostNickname : props.fight.guestNickname,
)
const opponentName = computed(() =>
  role.value === 'host' ? props.fight.guestNickname : props.fight.hostNickname,
)
const ownPoints = computed(() =>
  role.value === 'host' ? props.fight.hostPoints : props.fight.guestPoints,
)
const opponentPoints = computed(() =>
  role.value === 'host' ? props.fight.guestPoints : props.fight.hostPoints,
)
const ownTeam = computed(() => getOwnTeam(props.fight, role.value))
const opponentTeam = computed(() => getOpponentTeam(props.fight, role.value))
const usedOwnIndexes = computed(() => getUsedOwnIndexes(props.fight, role.value))
const usedOpponentIndexes = computed(() => getUsedOpponentIndexes(props.fight, role.value))
const loserTeam = computed(() =>
  props.fight.loserPlayerId === props.fight.hostPlayerId ? props.fight.hostTeam : props.fight.guestTeam ?? [],
)

const overviewPayload = computed(() =>
  props.fight.state === 'round_overview' ? asRoundOverviewPayload(props.fight) : null,
)
const resolutionPayload = computed(() =>
  props.fight.state === 'round_resolution' ? asRoundResolutionPayload(props.fight) : null,
)
const lootPayload = computed(() =>
  props.fight.state === 'loot_reveal' ? asLootRevealPayload(props.fight) : null,
)

const phaseTimes = computed(() => {
  const startMs = props.fight.phaseStartedAt ? new Date(props.fight.phaseStartedAt).getTime() : props.now
  const endMs = props.fight.phaseEndsAt ? new Date(props.fight.phaseEndsAt).getTime() : props.now
  return {
    endMs,
    progress: Math.min(1, Math.max(0, (props.now - startMs) / Math.max(1, endMs - startMs))),
    startMs,
  }
})

function cheeseForName(name: string) {
  return getCheeseByName(name)
}

function overviewDisplayIndex(finalIndex: number) {
  if (!props.fight.phaseEndsAt || props.now >= phaseTimes.value.endMs) {
    return finalIndex
  }

  return Math.floor((props.now - phaseTimes.value.startMs) / 180) % 3
}

const displayOwnOverviewIndex = computed(() => {
  if (!overviewPayload.value) {
    return null
  }

  return overviewDisplayIndex(
    role.value === 'host' ? overviewPayload.value.hostFighterIndex : overviewPayload.value.guestFighterIndex,
  )
})

const displayOpponentOverviewIndex = computed(() => {
  if (!overviewPayload.value) {
    return null
  }

  return overviewDisplayIndex(
    role.value === 'host' ? overviewPayload.value.guestFighterIndex : overviewPayload.value.hostFighterIndex,
  )
})

const ownResolutionCheese = computed(() => {
  if (!resolutionPayload.value) {
    return null
  }

  const cheeseName =
    role.value === 'host' ? resolutionPayload.value.hostCheeseName : resolutionPayload.value.guestCheeseName
  return cheeseForName(cheeseName)
})

const opponentResolutionCheese = computed(() => {
  if (!resolutionPayload.value) {
    return null
  }

  const cheeseName =
    role.value === 'host' ? resolutionPayload.value.guestCheeseName : resolutionPayload.value.hostCheeseName
  return cheeseForName(cheeseName)
})

const ownShare = computed(() => {
  if (!resolutionPayload.value) {
    return 0.5
  }

  return role.value === 'host' ? resolutionPayload.value.hostShare : resolutionPayload.value.guestShare
})

const displayRollPosition = computed(() => {
  if (!resolutionPayload.value) {
    return 0.5
  }

  // rollPosition is authoritative from the host's frame: values <= hostShare = host wins (left/green).
  // The guest's bar is also left=green, so their winning zone maps to the opposite end — mirror it.
  const finalPosition =
    role.value === 'host'
      ? resolutionPayload.value.rollPosition
      : 1 - resolutionPayload.value.rollPosition

  if (!props.fight.phaseEndsAt || props.now >= phaseTimes.value.endMs - 1500) {
    return finalPosition
  }

  const elapsed = props.now - phaseTimes.value.startMs
  const oscillation = Math.sin(elapsed / 140)
  return (oscillation + 1) / 2
})

const isResolutionSettled = computed(() => {
  if (props.fight.state !== 'round_resolution') {
    return false
  }

  if (!props.fight.phaseEndsAt) {
    return true
  }

  return props.now >= phaseTimes.value.endMs - 1500
})

const ownWonResolution = computed(() => {
  if (!resolutionPayload.value) {
    return false
  }

  return resolutionPayload.value.winnerPlayerId === props.playerId
})

const lootDisplayIndex = computed(() => {
  if (!lootPayload.value) {
    return null
  }

  if (!props.fight.phaseEndsAt || props.now >= phaseTimes.value.endMs) {
    return lootPayload.value.loserFighterIndex
  }

  return Math.floor((props.now - phaseTimes.value.startMs) / 180) % 3
})

const loserName = computed(() => {
  if (!props.fight.loserPlayerId) {
    return ''
  }

  return props.fight.loserPlayerId === props.fight.hostPlayerId
    ? props.fight.hostNickname
    : props.fight.guestNickname
})

const winnerName = computed(() => {
  if (!props.fight.winnerPlayerId) {
    return ''
  }

  return props.fight.winnerPlayerId === props.fight.hostPlayerId
    ? props.fight.hostNickname
    : props.fight.guestNickname
})
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-3 py-2">
      <span class="text-sm font-medium">{{ opponentName }}</span>
      <span class="text-lg font-semibold">{{ opponentPoints }} - {{ ownPoints }}</span>
      <span class="text-sm font-medium">{{ ownName }}</span>
    </div>

    <template v-if="fight.state === 'waiting_for_guest_team'">
      <div class="rounded-box border border-base-300 bg-base-100 p-4 text-center shadow-sm">
        <p class="font-medium">Waiting for opponent...</p>
        <p class="text-sm text-base-content/70">They still need to pick their fighters.</p>
      </div>
    </template>

    <template v-else-if="fight.state === 'round_overview'">
      <div class="space-y-5">
        <div class="space-y-2">
          <p class="text-sm font-medium text-base-content/70">{{ opponentName }}</p>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(cheeseName, index) in opponentTeam" :key="`${cheeseName}:${index}`" class="space-y-1">
              <div class="h-4 text-center text-primary">
                <span
                  v-if="displayOpponentOverviewIndex === index"
                  class="inline-block animate-bounce text-sm font-semibold"
                >
                  ▼
                </span>
              </div>
              <FightCheeseCard
                v-if="cheeseForName(cheeseName)"
                :cheese="cheeseForName(cheeseName)!"
                :faded="usedOpponentIndexes.includes(index)"
                disabled
                mini
              />
            </div>
          </div>
        </div>

        <p class="text-center text-sm font-medium text-base-content/70">Picking fighters....</p>

        <div class="space-y-2">
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(cheeseName, index) in ownTeam" :key="`${cheeseName}:${index}`" class="space-y-1">
              <div class="h-4 text-center text-primary">
                <span v-if="displayOwnOverviewIndex === index" class="inline-block animate-bounce text-sm font-semibold">
                  ▼
                </span>
              </div>
              <FightCheeseCard
                v-if="cheeseForName(cheeseName)"
                :cheese="cheeseForName(cheeseName)!"
                :faded="usedOwnIndexes.includes(index)"
                disabled
                mini
              />
            </div>
          </div>
          <p class="text-sm font-medium text-base-content/70">{{ ownName }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="fight.state === 'round_resolution' && ownResolutionCheese && opponentResolutionCheese">
      <div class="space-y-4">
        <div class="mx-auto max-w-28">
          <FightCheeseCard
            :cheese="opponentResolutionCheese"
            :faded="isResolutionSettled && ownWonResolution"
            :spinning="isResolutionSettled && !ownWonResolution"
            disabled
          />
        </div>

        <div class="space-y-2">
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-success">You</span>
              <span class="text-error">{{ opponentName }}</span>
            </div>
            <div class="relative">
              <div
                class="absolute -top-5 text-sm font-semibold text-primary"
                :style="{ left: `calc(${displayRollPosition * 100}% - 6px)` }"
              >
                ▼
              </div>
              <div class="relative h-6 overflow-hidden rounded-full bg-base-300">
                <div class="absolute inset-y-0 left-0 bg-success" :style="{ width: `${ownShare * 100}%` }"></div>
                <div
                  class="absolute inset-y-0 right-0 bg-error"
                  :style="{ width: `${(1 - ownShare) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>

          <p v-if="isResolutionSettled" class="text-center text-sm font-medium">
            {{ resolutionPayload?.winnerCheeseName }} wins
          </p>
          <p v-else class="text-center text-sm font-medium text-base-content/50">Deciding...</p>
        </div>

        <div class="mx-auto max-w-28">
          <FightCheeseCard
            :cheese="ownResolutionCheese"
            :faded="isResolutionSettled && !ownWonResolution"
            :spinning="isResolutionSettled && ownWonResolution"
            disabled
          />
        </div>
      </div>
    </template>

    <template v-else-if="fight.state === 'loot_reveal' && lootPayload">
      <div class="space-y-4">
        <p class="text-center text-lg font-semibold">{{ winnerName }} won</p>
        <p class="text-center text-sm text-base-content/70">{{ loserName }} loses a fighter</p>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="(cheeseName, index) in loserTeam" :key="`${cheeseName}:${index}`" class="space-y-1">
            <div class="h-4 text-center text-primary">
              <span v-if="lootDisplayIndex === index" class="inline-block animate-bounce text-sm font-semibold">
                ▼
              </span>
            </div>
            <FightCheeseCard
              v-if="cheeseForName(cheeseName)"
              :cheese="cheeseForName(cheeseName)!"
              :faded="lootDisplayIndex !== null && lootDisplayIndex !== index"
              disabled
              mini
            />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
