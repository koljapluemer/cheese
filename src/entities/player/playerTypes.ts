export interface PlayerSummary {
  cheeseCount: number
  cows: number
  id: string
  nickname: string
  score: number
  starterPicksCompleted: number
  uniqueTypes: number
}

export interface LeaderboardEntry extends PlayerSummary {
  rank: number
}

export interface InventoryEntry {
  cheeseName: string
  quantity: number
}

