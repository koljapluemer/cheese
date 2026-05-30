import {
  getPlayerInventoryItem,
  getPlayerSummary,
  saveInventoryItem,
  updatePlayerEconomy,
} from '@/entities/player/playerApi'

export async function pickStarterCheese(playerId: string, cheeseName: string) {
  const player = await getPlayerSummary(playerId)
  const inventoryItem = await getPlayerInventoryItem(playerId, cheeseName)

  await saveInventoryItem(playerId, cheeseName, (inventoryItem?.quantity ?? 0) + 1)
  await updatePlayerEconomy(playerId, player.cows, Math.min(player.starterPicksCompleted + 1, 3))

  return getPlayerSummary(playerId)
}

