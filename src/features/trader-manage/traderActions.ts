import { getAllCheeses } from '@/entities/cheese/cheeseCatalog'
import {
  getPlayerInventoryItem,
  getPlayerSummary,
  saveInventoryItem,
  updatePlayerEconomy,
} from '@/entities/player/playerApi'
import { getTraderPrices, upsertTraderPrices, type TraderPrice } from '@/entities/trader/traderApi'

function randomDelta() {
  return Math.floor(Math.random() * 7) - 3
}

function buildInitialBuyPrice() {
  const exponent = Math.pow(Math.random(), 2.2)
  const rawValue = 3 * Math.pow(100 / 3, exponent)

  return Math.max(3, Math.min(100, Math.round(rawValue)))
}

function clampSellPrice(buyPrice: number, sellPrice: number) {
  return Math.max(1, Math.min(sellPrice, buyPrice - 2))
}

function buildInitialPrices(): TraderPrice[] {
  return getAllCheeses()
    .map((cheese) => {
      const buyPrice = buildInitialBuyPrice()
      const sellCeiling = Math.max(1, buyPrice - 2)

      return {
        buyPrice,
        cheeseName: cheese.name,
        sellPrice: Math.floor(Math.random() * sellCeiling) + 1,
        updatedAt: new Date().toISOString(),
      }
    })
    .sort((left, right) => left.cheeseName.localeCompare(right.cheeseName))
}

function refreshPrices(prices: TraderPrice[]) {
  return prices.map((price) => {
    const buyPrice = Math.max(3, price.buyPrice + randomDelta())
    const sellPrice = clampSellPrice(buyPrice, price.sellPrice + randomDelta())

    return {
      ...price,
      buyPrice,
      sellPrice,
      updatedAt: new Date().toISOString(),
    }
  })
}

function needsRefresh(prices: TraderPrice[]) {
  if (prices.length !== getAllCheeses().length) {
    return true
  }

  const mostRecent = prices.reduce((latest, price) => {
    const nextValue = new Date(price.updatedAt).getTime()
    return Math.max(latest, nextValue)
  }, 0)

  return Date.now() - mostRecent >= 60_000
}

export async function ensureTraderPricesFresh() {
  const currentPrices = await getTraderPrices()

  if (currentPrices.length === 0) {
    const initialPrices = buildInitialPrices()
    await upsertTraderPrices(initialPrices)
    return initialPrices
  }

  if (!needsRefresh(currentPrices)) {
    return currentPrices
  }

  const nextPrices = refreshPrices(currentPrices)
  await upsertTraderPrices(nextPrices)
  return nextPrices
}

export async function buyTraderCheese(playerId: string, price: TraderPrice) {
  const player = await getPlayerSummary(playerId)

  if (player.cows < price.buyPrice) {
    throw new Error('Not enough cows.')
  }

  const inventoryItem = await getPlayerInventoryItem(playerId, price.cheeseName)

  await saveInventoryItem(playerId, price.cheeseName, (inventoryItem?.quantity ?? 0) + 1)
  await updatePlayerEconomy(playerId, player.cows - price.buyPrice, player.starterPicksCompleted)

  return getPlayerSummary(playerId)
}

export async function sellTraderCheese(playerId: string, price: TraderPrice) {
  const inventoryItem = await getPlayerInventoryItem(playerId, price.cheeseName)

  if (!inventoryItem || inventoryItem.quantity < 1) {
    throw new Error(`No ${price.cheeseName} to sell.`)
  }

  const player = await getPlayerSummary(playerId)

  await saveInventoryItem(playerId, price.cheeseName, inventoryItem.quantity - 1)
  await updatePlayerEconomy(playerId, player.cows + price.sellPrice, player.starterPicksCompleted)

  return getPlayerSummary(playerId)
}

