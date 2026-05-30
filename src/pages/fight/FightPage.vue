<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useToastStore } from '@/dumb/toast/toastStore'
import QrInviteModal from '@/dumb/ui/QrInviteModal.vue'
import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'
import {
  acceptFightOffer,
  cancelFightOffer,
  createFightOffer,
  getActiveFightForPlayer,
  getAvailableFightOffers,
  getFightById,
  getOwnOpenFightOffer,
  submitGuestFightTeam,
  subscribeToFightOffers,
  subscribeToPlayerFights,
  updateFightIfCurrent,
} from '@/entities/fight/fightApi'
import type { Fight, FightOffer } from '@/entities/fight/fightTypes'
import {
  getPlayerInventory,
  getPlayerInventoryItem,
  getPlayerSummary,
  saveInventoryItem,
  updatePlayerFightRecord,
} from '@/entities/player/playerApi'
import type { InventoryEntry } from '@/entities/player/playerTypes'
import { hydratePlayerSession, usePlayerSessionStore } from '@/features/player-session/playerSessionStore'

import FightArenaView from './FightArenaView.vue'
import FightCheeseCard from './FightCheeseCard.vue'
import FightTeamSelection from './FightTeamSelection.vue'
import {
  asLootRevealPayload,
  asRoundOverviewPayload,
  asRoundResolutionPayload,
  buildLootRevealPayload,
  buildRoundOverviewPayload,
  buildRoundResolutionPayload,
  expandInventoryForFight,
  getFightRole,
  isPhaseExpired,
  pickRandomUnusedIndex,
} from './fightPageHelpers'

const ROUND_OVERVIEW_MS = 5000
const ROUND_RESOLUTION_MS = 5000
const LOOT_REVEAL_MS = 2600

const route = useRoute()
const { sessionState } = usePlayerSessionStore()
const { showToast } = useToastStore()

const activeFight = ref<Fight | null>(null)
const availableOffers = ref<FightOffer[]>([])
const inventory = ref<InventoryEntry[]>([])
const isAdvancingFight = ref(false)
const isBusy = ref(false)
const isLoading = ref(true)
const loadError = ref('')
const now = ref(Date.now())
const ownOffer = ref<FightOffer | null>(null)
const selectedInstanceIds = ref<string[]>([])
const selectionMode = ref<'offer' | null>(null)
const showQrModal = ref(false)

const inviteOfferId = typeof route.query.invite === 'string' ? route.query.invite : null

let clockTimer: ReturnType<typeof setInterval> | null = null
let unsubscribeFightOffers: (() => void) | null = null
let unsubscribePlayerFights: (() => void) | null = null
let lastResolutionToastKey = ''
let lastCompletionToastKey = ''
let loadSeq = 0
let completionWindowEnd = 0

const playerId = computed(() => sessionState.player?.id ?? '')
const selectables = computed(() => expandInventoryForFight(inventory.value))
const selectedTeamCheeseNames = computed(() =>
  selectables.value
    .filter((item) => selectedInstanceIds.value.includes(item.instanceId))
    .map((item) => item.cheese.name),
)
const fightRole = computed(() =>
  activeFight.value && playerId.value ? getFightRole(activeFight.value, playerId.value) : null,
)
const requiresGuestTeamSelection = computed(
  () =>
    Boolean(
      activeFight.value &&
        fightRole.value === 'guest' &&
        activeFight.value.state === 'waiting_for_guest_team' &&
        !activeFight.value.guestTeam,
    ),
)
const waitingForOpponentName = computed(() => {
  if (!activeFight.value || !fightRole.value || activeFight.value.state !== 'waiting_for_guest_team') {
    return ''
  }

  return fightRole.value === 'host' ? activeFight.value.guestNickname : activeFight.value.hostNickname
})
const waitingPreviewTeam = computed(() => {
  if (!activeFight.value || !fightRole.value) {
    return []
  }

  return fightRole.value === 'host' ? activeFight.value.hostTeam : activeFight.value.guestTeam ?? []
})
const waitingPreviewCheeses = computed(() =>
  waitingPreviewTeam.value
    .map((cheeseName, index) => ({
      cheese: getCheeseByName(cheeseName),
      key: `${cheeseName}:${index}`,
    }))
    .filter(
      (
        item,
      ): item is {
        cheese: NonNullable<ReturnType<typeof getCheeseByName>>
        key: string
      } => Boolean(item.cheese),
    ),
)

function phaseEndsAtAfter(durationMs: number) {
  const startedAt = new Date()

  return {
    endsAt: new Date(startedAt.getTime() + durationMs).toISOString(),
    startedAt: startedAt.toISOString(),
  }
}

function resetSelection() {
  selectedInstanceIds.value = []
  selectionMode.value = null
}

function toggleSelection(instanceId: string) {
  if (isBusy.value) {
    return
  }

  if (selectedInstanceIds.value.includes(instanceId)) {
    selectedInstanceIds.value = selectedInstanceIds.value.filter((currentId) => currentId !== instanceId)
    return
  }

  if (selectedInstanceIds.value.length >= 3) {
    return
  }

  selectedInstanceIds.value = [...selectedInstanceIds.value, instanceId]
}

function applyFightIfNewer(incoming: Fight | null) {
  if (incoming === null) {
    if (Date.now() < completionWindowEnd) {
      return
    }
    activeFight.value = null
    return
  }

  if (!activeFight.value || incoming.updatedAt >= activeFight.value.updatedAt) {
    activeFight.value = incoming
  }
}

async function loadFightPage() {
  if (!playerId.value) {
    return
  }

  const seq = ++loadSeq
  isLoading.value = true
  loadError.value = ''

  try {
    const [nextOwnOffer, nextAvailableOffers, nextActiveFight, nextInventory] = await Promise.all([
      getOwnOpenFightOffer(playerId.value),
      getAvailableFightOffers(playerId.value),
      getActiveFightForPlayer(playerId.value),
      getPlayerInventory(playerId.value),
    ])

    if (seq !== loadSeq) {
      return
    }

    ownOffer.value = nextOwnOffer
    availableOffers.value = nextAvailableOffers
    applyFightIfNewer(nextActiveFight)
    inventory.value = nextInventory

    if (nextActiveFight || !selectionMode.value) {
      selectedInstanceIds.value = []
    }
  } catch (error) {
    if (seq !== loadSeq) {
      return
    }

    loadError.value = error instanceof Error ? error.message : 'Could not load fights.'
  } finally {
    if (seq === loadSeq) {
      isLoading.value = false
    }
  }
}

function maybeShowRoundToast(fight: Fight) {
  if (fight.state !== 'round_resolution') {
    return
  }

  const payload = asRoundResolutionPayload(fight)
  const winnerName = payload.winnerPlayerId === fight.hostPlayerId ? fight.hostNickname : fight.guestNickname
  const toastKey = `${fight.id}:${fight.hostPoints}:${fight.guestPoints}:${payload.winnerCheeseName}`

  if (lastResolutionToastKey === toastKey) {
    return
  }

  lastResolutionToastKey = toastKey
  showToast(`${payload.winnerCheeseName} wins! 1 point for player ${winnerName}!`, 'success')
}

function maybeShowCompletionToast(fight: Fight) {
  if (fight.state !== 'completed' || !fight.stolenCheeseName || !fight.winnerPlayerId) {
    return
  }

  const winnerName = fight.winnerPlayerId === fight.hostPlayerId ? fight.hostNickname : fight.guestNickname
  const toastKey = `${fight.id}:${fight.stolenCheeseName}:${winnerName}`

  if (lastCompletionToastKey === toastKey) {
    return
  }

  lastCompletionToastKey = toastKey

  if (fight.winnerPlayerId === playerId.value) {
    showToast(`You stole 1 ${fight.stolenCheeseName}.`, 'success')
    return
  }

  showToast(`${winnerName} stole 1 ${fight.stolenCheeseName}.`, 'info')
}

async function handlePrimaryAction() {
  if (!sessionState.player || isBusy.value) {
    return
  }

  if (ownOffer.value) {
    isBusy.value = true

    try {
      await cancelFightOffer(ownOffer.value.id, sessionState.player.id)
      showToast('Fight offer cancelled.', 'info')
      await loadFightPage()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not cancel the fight offer.', 'error')
    } finally {
      isBusy.value = false
    }

    return
  }

  selectionMode.value = 'offer'
  selectedInstanceIds.value = []
}

async function handleCreateOffer() {
  if (!sessionState.player || isBusy.value || selectedTeamCheeseNames.value.length !== 3) {
    return
  }

  isBusy.value = true

  try {
    await createFightOffer({
      hostNickname: sessionState.player.nickname,
      hostPlayerId: sessionState.player.id,
      hostTeam: selectedTeamCheeseNames.value,
    })
    resetSelection()
    showToast('People can fight you now.', 'success')
    await loadFightPage()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not create the fight offer.', 'error')
  } finally {
    isBusy.value = false
  }
}

async function handleAcceptOffer(offer: FightOffer, overrideOwnOffer = false) {
  if (!sessionState.player || isBusy.value) {
    return
  }

  if (ownOffer.value && !overrideOwnOffer) {
    return
  }

  isBusy.value = true

  try {
    if (ownOffer.value) {
      await cancelFightOffer(ownOffer.value.id, sessionState.player.id)
    }

    await acceptFightOffer({
      guestNickname: sessionState.player.nickname,
      guestPlayerId: sessionState.player.id,
      offerId: offer.id,
    })
    selectedInstanceIds.value = []
    await loadFightPage()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not accept the fight offer.', 'error')
  } finally {
    isBusy.value = false
  }
}

async function handleSubmitGuestTeam() {
  if (
    !sessionState.player ||
    !activeFight.value ||
    isBusy.value ||
    selectedTeamCheeseNames.value.length !== 3
  ) {
    return
  }

  isBusy.value = true

  try {
    await submitGuestFightTeam(activeFight.value.id, sessionState.player.id, selectedTeamCheeseNames.value)
    resetSelection()
    await loadFightPage()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not submit your team.', 'error')
  } finally {
    isBusy.value = false
  }
}

async function startRoundOverview(fight: Fight) {
  const guestTeamLength = fight.guestTeam?.length ?? 0
  const hostFighterIndex = pickRandomUnusedIndex(fight.hostTeam.length, fight.usedHostFighterIndexes)
  const guestFighterIndex = pickRandomUnusedIndex(guestTeamLength, fight.usedGuestFighterIndexes)

  if (hostFighterIndex == null || guestFighterIndex == null) {
    return
  }

  const payload = buildRoundOverviewPayload(fight, hostFighterIndex, guestFighterIndex)
  const phaseTimes = phaseEndsAtAfter(ROUND_OVERVIEW_MS)

  const updated = await updateFightIfCurrent(fight.id, fight.updatedAt, {
    phase_ends_at: phaseTimes.endsAt,
    phase_payload: payload,
    phase_started_at: phaseTimes.startedAt,
    state: 'round_overview',
  })

  if (updated) {
    activeFight.value = updated
  }
}

async function finishRoundOverview(fight: Fight) {
  const payload = asRoundOverviewPayload(fight)
  const resolution = buildRoundResolutionPayload(payload, fight.hostPlayerId, fight.guestPlayerId)
  const phaseTimes = phaseEndsAtAfter(ROUND_RESOLUTION_MS)

  const updated = await updateFightIfCurrent(fight.id, fight.updatedAt, {
    phase_ends_at: phaseTimes.endsAt,
    phase_payload: resolution,
    phase_started_at: phaseTimes.startedAt,
    state: 'round_resolution',
  })

  if (updated) {
    activeFight.value = updated
  }
}

async function finishRoundResolution(fight: Fight) {
  const payload = asRoundResolutionPayload(fight)
  const nextHostPoints = fight.hostPoints + (payload.winnerPlayerId === fight.hostPlayerId ? 1 : 0)
  const nextGuestPoints = fight.guestPoints + (payload.winnerPlayerId === fight.guestPlayerId ? 1 : 0)
  const nextUsedHostFighterIndexes = [...fight.usedHostFighterIndexes, payload.hostFighterIndex]
  const nextUsedGuestFighterIndexes = [...fight.usedGuestFighterIndexes, payload.guestFighterIndex]

  if (nextHostPoints >= 2 || nextGuestPoints >= 2) {
    const winnerPlayerId = nextHostPoints >= 2 ? fight.hostPlayerId : fight.guestPlayerId
    const loserPlayerId = winnerPlayerId === fight.hostPlayerId ? fight.guestPlayerId : fight.hostPlayerId
    const lootPayload = buildLootRevealPayload(fight, loserPlayerId)
    const phaseTimes = phaseEndsAtAfter(LOOT_REVEAL_MS)

    const updated = await updateFightIfCurrent(fight.id, fight.updatedAt, {
      guest_points: nextGuestPoints,
      host_points: nextHostPoints,
      loser_player_id: loserPlayerId,
      phase_ends_at: phaseTimes.endsAt,
      phase_payload: lootPayload,
      phase_started_at: phaseTimes.startedAt,
      state: 'loot_reveal',
      stolen_cheese_name: lootPayload.loserCheeseName,
      used_guest_fighter_indexes: nextUsedGuestFighterIndexes,
      used_host_fighter_indexes: nextUsedHostFighterIndexes,
      winner_player_id: winnerPlayerId,
    })

    if (updated) {
      activeFight.value = updated
    }

    return
  }

  const hostFighterIndex = pickRandomUnusedIndex(fight.hostTeam.length, nextUsedHostFighterIndexes)
  const guestFighterIndex = pickRandomUnusedIndex(fight.guestTeam?.length ?? 0, nextUsedGuestFighterIndexes)

  if (hostFighterIndex == null || guestFighterIndex == null) {
    return
  }

  const nextOverview = buildRoundOverviewPayload(fight, hostFighterIndex, guestFighterIndex)
  const phaseTimes = phaseEndsAtAfter(ROUND_OVERVIEW_MS)

  const updated = await updateFightIfCurrent(fight.id, fight.updatedAt, {
    guest_points: nextGuestPoints,
    host_points: nextHostPoints,
    phase_ends_at: phaseTimes.endsAt,
    phase_payload: nextOverview,
    phase_started_at: phaseTimes.startedAt,
    state: 'round_overview',
    used_guest_fighter_indexes: nextUsedGuestFighterIndexes,
    used_host_fighter_indexes: nextUsedHostFighterIndexes,
  })

  if (updated) {
    activeFight.value = updated
  }
}

async function finishLootReveal(fight: Fight) {
  const payload = asLootRevealPayload(fight)

  if (!fight.winnerPlayerId || !fight.loserPlayerId) {
    return
  }

  const [winnerSummary, loserSummary, winnerInventoryItem, loserInventoryItem] = await Promise.all([
    getPlayerSummary(fight.winnerPlayerId),
    getPlayerSummary(fight.loserPlayerId),
    getPlayerInventoryItem(fight.winnerPlayerId, payload.loserCheeseName),
    getPlayerInventoryItem(fight.loserPlayerId, payload.loserCheeseName),
  ])

  if (!loserInventoryItem || loserInventoryItem.quantity < 1) {
    throw new Error('The stolen cheese is no longer available.')
  }

  await saveInventoryItem(fight.loserPlayerId, payload.loserCheeseName, loserInventoryItem.quantity - 1)
  await saveInventoryItem(fight.winnerPlayerId, payload.loserCheeseName, (winnerInventoryItem?.quantity ?? 0) + 1)
  await updatePlayerFightRecord(fight.winnerPlayerId, winnerSummary.fightsPlayed + 1, winnerSummary.fightsWon + 1)
  await updatePlayerFightRecord(fight.loserPlayerId, loserSummary.fightsPlayed + 1, loserSummary.fightsWon)

  const updated = await updateFightIfCurrent(fight.id, fight.updatedAt, {
    phase_ends_at: null,
    phase_started_at: new Date().toISOString(),
    state: 'completed',
  })

  if (updated) {
    completionWindowEnd = Date.now() + 2000
    setTimeout(() => {
      completionWindowEnd = 0
      activeFight.value = null
    }, 2000)
  }
}

async function maybeAdvanceFight() {
  if (
    !activeFight.value ||
    !playerId.value ||
    activeFight.value.hostPlayerId !== playerId.value ||
    isAdvancingFight.value
  ) {
    return
  }

  // Snapshot state and fight once — never re-read activeFight.value after an await,
  // because the subscription may update it mid-flight and cause double-advancement.
  const fight = activeFight.value
  const state = fight.state

  if (state === 'waiting_for_guest_team' && fight.guestTeam && fight.guestTeam.length === 3) {
    isAdvancingFight.value = true

    try {
      await startRoundOverview(fight)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not start the fight.', 'error')
    } finally {
      isAdvancingFight.value = false
    }

    return
  }

  if (!isPhaseExpired(fight.phaseEndsAt) || Date.now() < completionWindowEnd) {
    return
  }

  isAdvancingFight.value = true

  try {
    if (state === 'round_overview') {
      await finishRoundOverview(fight)
    } else if (state === 'round_resolution') {
      await finishRoundResolution(fight)
    } else if (state === 'loot_reveal') {
      await finishLootReveal(fight)
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not advance the fight.', 'error')
  } finally {
    isAdvancingFight.value = false
  }
}

function subscribeToRealtime() {
  if (!playerId.value) {
    return
  }

  unsubscribeFightOffers?.()
  unsubscribePlayerFights?.()

  unsubscribeFightOffers = subscribeToFightOffers(() => {
    void loadFightPage()
  })
  unsubscribePlayerFights = subscribeToPlayerFights(playerId.value, ({ fightId, state }) => {
    void (async () => {
      if (state === 'round_resolution' || state === 'completed') {
        try {
          const fight = await getFightById(fightId)

          if (state === 'round_resolution') {
            const settledAt = fight.phaseEndsAt
              ? new Date(fight.phaseEndsAt).getTime() - 1500
              : Date.now()
            const delay = Math.max(0, settledAt - Date.now())
            setTimeout(() => maybeShowRoundToast(fight), delay)
          }

          if (state === 'completed') {
            maybeShowCompletionToast(fight)
            void hydratePlayerSession()
          }
        } catch {
          // Ignore transient refresh errors and fall back to reloading page state below.
        }
      }

      await loadFightPage()
    })()
  })
}

watch(
  () => sessionState.revision,
  () => {
    void loadFightPage()
  },
)

watch(
  () => sessionState.player?.id,
  () => {
    subscribeToRealtime()
    void loadFightPage()
  },
)

watch(
  () => activeFight.value?.id,
  () => {
    selectedInstanceIds.value = []
  },
)

async function maybeAutoAcceptInvite() {
  if (!inviteOfferId || !sessionState.player || activeFight.value) {
    return
  }

  const offer = availableOffers.value.find((o) => o.id === inviteOfferId)

  if (!offer) {
    showToast('This fight offer is no longer available.', 'error')
    return
  }

  await handleAcceptOffer(offer, true)
}

onMounted(() => {
  subscribeToRealtime()
  clockTimer = setInterval(() => {
    now.value = Date.now()
    void maybeAdvanceFight()
  }, 150)
  void loadFightPage().then(() => maybeAutoAcceptInvite())
})

onUnmounted(() => {
  unsubscribeFightOffers?.()
  unsubscribePlayerFights?.()

  if (clockTimer) {
    clearInterval(clockTimer)
  }
})
</script>

<template>
  <section class="space-y-4">
    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="activeFight && requiresGuestTeamSelection">
      <FightTeamSelection
        :busy="isBusy"
        :cheeses="selectables"
        :selected-ids="selectedInstanceIds"
        title="Pick your fighters"
        @cancel="selectedInstanceIds = []"
        @submit="handleSubmitGuestTeam"
        @toggle="toggleSelection"
      />
    </template>

    <template v-else-if="activeFight && activeFight.state === 'waiting_for_guest_team'">
      <div class="space-y-4">
        <h1 class="text-2xl font-bold">Fight</h1>
        <p class="text-sm text-base-content/70">Waiting for {{ waitingForOpponentName }} to lock in a team.</p>
        <div class="grid grid-cols-3 gap-2">
          <FightCheeseCard
            v-for="item in waitingPreviewCheeses"
            :key="item.key"
            :cheese="item.cheese"
            disabled
          />
        </div>
      </div>
    </template>

    <template v-else-if="activeFight">
      <FightArenaView :fight="activeFight" :now="now" :player-id="playerId" />
    </template>

    <template v-else-if="selectionMode === 'offer'">
      <FightTeamSelection
        :busy="isBusy"
        :cheeses="selectables"
        :selected-ids="selectedInstanceIds"
        title="Pick your fighters"
        @cancel="resetSelection"
        @submit="handleCreateOffer"
        @toggle="toggleSelection"
      />
    </template>

    <template v-else>
      <div class="space-y-4">
        <h1 class="text-2xl font-bold">Fight</h1>

        <button type="button" class="btn btn-primary btn-block btn-lg" :disabled="isBusy" @click="handlePrimaryAction">
          {{ ownOffer ? 'Cancel Fight Offer' : 'Offer a Fight' }}
        </button>

        <button
          v-if="ownOffer"
          type="button"
          class="btn btn-outline btn-block"
          @click="showQrModal = true"
        >
          Invite to Fight
        </button>

        <p v-if="ownOffer" class="text-sm text-base-content/70">Waiting for someone to accept.</p>

        <div class="space-y-3">
          <div
            v-for="offer in availableOffers"
            :key="offer.id"
            class="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-3 py-3"
          >
            <span class="font-medium">{{ offer.hostNickname }}</span>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :disabled="isBusy || Boolean(ownOffer)"
              @click="handleAcceptOffer(offer)"
            >
              Accept
            </button>
          </div>

          <p v-if="availableOffers.length === 0" class="text-sm text-base-content/70">No open fights.</p>
        </div>
      </div>
    </template>

    <QrInviteModal
      v-if="ownOffer"
      :offer-id="ownOffer.id"
      :open="showQrModal"
      @close="showQrModal = false"
    />
  </section>
</template>
