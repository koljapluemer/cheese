import type { StoredWheelState, WheelSegment, WheelSlot } from './wheelTypes'

const WHEEL_INTERVAL_MS = 10 * 60 * 1000
const wheelStoragePrefix = 'cheese-wheel-state'

function buildWheelStateStorageKey(playerId: string, slotStartMs: number) {
  return `${wheelStoragePrefix}:${playerId}:${slotStartMs}`
}

export function getWheelIntervalMs() {
  return WHEEL_INTERVAL_MS
}

export function getWheelSlot(now: number): WheelSlot {
  const slotStartMs = Math.floor(now / WHEEL_INTERVAL_MS) * WHEEL_INTERVAL_MS

  return {
    slotEndMs: slotStartMs + WHEEL_INTERVAL_MS,
    slotStartMs,
  }
}

export function readStoredWheelState(playerId: string, slotStartMs: number) {
  const rawValue = localStorage.getItem(buildWheelStateStorageKey(playerId, slotStartMs))

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredWheelState
  } catch {
    localStorage.removeItem(buildWheelStateStorageKey(playerId, slotStartMs))
    return null
  }
}

export function writeStoredWheelState(state: StoredWheelState) {
  localStorage.setItem(
    buildWheelStateStorageKey(state.playerId, state.slotStartMs),
    JSON.stringify(state),
  )
}

export function createStoredWheelState(
  playerId: string,
  slot: WheelSlot,
  segments: WheelSegment[],
): StoredWheelState {
  return {
    playerId,
    rewardApplied: false,
    segments,
    slotEndMs: slot.slotEndMs,
    slotStartMs: slot.slotStartMs,
    spent: false,
    winningSegmentId: null,
  }
}

export function commitWheelResult(state: StoredWheelState, winningSegmentId: string): StoredWheelState {
  return {
    ...state,
    spent: true,
    winningSegmentId,
  }
}

export function markWheelRewardApplied(state: StoredWheelState): StoredWheelState {
  return {
    ...state,
    rewardApplied: true,
  }
}
