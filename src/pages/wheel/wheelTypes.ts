export type WheelReward =
  | {
      cheeseName: string
      kind: 'cheese'
      source: 'cheap' | 'top'
    }
  | {
      cows: number
      kind: 'cows'
    }
  | {
      kind: 'destroy'
    }

export interface WheelSegment {
  id: string
  label: string
  reward: WheelReward
  weight: number
}

export interface StoredWheelState {
  playerId: string
  rewardApplied: boolean
  segments: WheelSegment[]
  slotEndMs: number
  slotStartMs: number
  spent: boolean
  winningSegmentId: string | null
}

export interface WheelSlot {
  slotEndMs: number
  slotStartMs: number
}
