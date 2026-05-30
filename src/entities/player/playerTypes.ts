export interface PlayerSummary {
  cheeseCount: number
  cows: number
  fightsPlayed: number
  fightsWon: number
  id: string
  nickname: string
  starterPicksCompleted: number
  uniqueTypes: number
  winRate: number
}

export interface LeaderboardEntry extends PlayerSummary {
  rank: number
}

export interface InventoryEntry {
  cheeseName: string
  quantity: number
}
