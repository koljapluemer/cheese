import { getAllCheeses } from '@/entities/cheese/cheeseCatalog'
import {
  getPlayerInventoryItem,
  getPlayerSummary,
  saveInventoryItem,
  updatePlayerEconomy,
} from '@/entities/player/playerApi'
import type { PlayerSummary } from '@/entities/player/playerTypes'
import {
  deleteTraderPrices,
  getTraderPrices,
  upsertTraderPrices,
  type TraderPrice,
} from '@/entities/trader/traderApi'

const TRADER_OFFER_COUNT = 10
export const TRADER_REFRESH_INTERVAL_MS = 120_000

function coinFlip() {
  return Math.random() >= 0.5
}

function buildInitialBuyPrice() {
  const exponent = Math.pow(Math.random(), 2.2)
  const rawValue = 3 * Math.pow(100 / 3, exponent)

  return Math.max(3, Math.min(100, Math.round(rawValue)))
}

function clampSellPrice(buyPrice: number, sellPrice: number) {
  return Math.max(1, Math.min(sellPrice, buyPrice - 2))
}

function sampleTraderCheeses() {
  const cheeses = [...getAllCheeses()]

  for (let index = cheeses.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[cheeses[index], cheeses[swapIndex]] = [cheeses[swapIndex], cheeses[index]]
  }

  return cheeses.slice(0, Math.min(TRADER_OFFER_COUNT, cheeses.length))
}

function buildOfferPrice(cheeseName: string, offerStartsAt: string): TraderPrice {
  const buyPrice = buildInitialBuyPrice()
  const sellCeiling = Math.max(1, buyPrice - 2)

  return {
    buyPrice,
    cheeseName,
    offerStartsAt,
    sellPrice: Math.floor(Math.random() * sellCeiling) + 1,
    updatedAt: offerStartsAt,
  }
}

function buildTraderOffers(): TraderPrice[] {
  const offerStartsAt = new Date().toISOString()

  return sampleTraderCheeses()
    .map((cheese) => buildOfferPrice(cheese.name, offerStartsAt))
    .sort((left, right) => left.cheeseName.localeCompare(right.cheeseName))
}

function needsRefresh(prices: TraderPrice[]) {
  const expectedOfferCount = Math.min(TRADER_OFFER_COUNT, getAllCheeses().length)

  if (prices.length !== expectedOfferCount) {
    return true
  }

  const offerStartedAt = prices.reduce((earliest, price) => {
    const nextValue = new Date(price.offerStartsAt).getTime()
    return Math.min(earliest, nextValue)
  }, Number.POSITIVE_INFINITY)

  return Date.now() - offerStartedAt >= TRADER_REFRESH_INTERVAL_MS
}

async function replaceTraderOffers(currentPrices: TraderPrice[], nextPrices: TraderPrice[]) {
  await deleteTraderPrices(currentPrices.map((price) => price.cheeseName))
  await upsertTraderPrices(nextPrices)
}

function adjustPriceAfterBuy(price: TraderPrice) {
  const buyPrice = price.buyPrice + 1
  const sellPrice = clampSellPrice(buyPrice, price.sellPrice + (coinFlip() ? 1 : 0))

  return {
    ...price,
    buyPrice,
    sellPrice,
    updatedAt: new Date().toISOString(),
  }
}

function adjustPriceAfterSell(price: TraderPrice) {
  const buyPrice = Math.max(3, price.buyPrice - (coinFlip() ? 1 : 0))
  const sellPrice = clampSellPrice(buyPrice, price.sellPrice - 1)

  return {
    ...price,
    buyPrice,
    sellPrice,
    updatedAt: new Date().toISOString(),
  }
}

async function getCurrentTraderPrice(cheeseName: string) {
  const currentPrices = await getTraderPrices()
  const currentPrice = currentPrices.find((price) => price.cheeseName === cheeseName)

  if (!currentPrice) {
    throw new Error('This offer is no longer available. Refresh the trader.')
  }

  return currentPrice
}

export async function ensureTraderPricesFresh() {
  const currentPrices = await getTraderPrices()

  if (currentPrices.length === 0) {
    const initialPrices = buildTraderOffers()
    await upsertTraderPrices(initialPrices)
    return initialPrices
  }

  if (!needsRefresh(currentPrices)) {
    return currentPrices
  }

  const nextPrices = buildTraderOffers()
  await replaceTraderOffers(currentPrices, nextPrices)
  return nextPrices
}

export async function buyTraderCheese(
  playerId: string,
  price: TraderPrice,
): Promise<{ player: PlayerSummary; tradedPrice: number; updatedPrice: TraderPrice }> {
  const currentPrice = await getCurrentTraderPrice(price.cheeseName)
  const player = await getPlayerSummary(playerId)

  if (player.cows < currentPrice.buyPrice) {
    throw new Error('Not enough cows.')
  }

  const inventoryItem = await getPlayerInventoryItem(playerId, currentPrice.cheeseName)
  const updatedPrice = adjustPriceAfterBuy(currentPrice)

  await saveInventoryItem(playerId, currentPrice.cheeseName, (inventoryItem?.quantity ?? 0) + 1)
  await updatePlayerEconomy(playerId, player.cows - currentPrice.buyPrice, player.starterPicksCompleted)
  await upsertTraderPrices([updatedPrice])

  return {
    player: await getPlayerSummary(playerId),
    tradedPrice: currentPrice.buyPrice,
    updatedPrice,
  }
}

export async function sellTraderCheese(
  playerId: string,
  price: TraderPrice,
): Promise<{ player: PlayerSummary; tradedPrice: number; updatedPrice: TraderPrice }> {
  const currentPrice = await getCurrentTraderPrice(price.cheeseName)
  const inventoryItem = await getPlayerInventoryItem(playerId, currentPrice.cheeseName)

  if (!inventoryItem || inventoryItem.quantity < 1) {
    throw new Error(`No ${currentPrice.cheeseName} to sell.`)
  }

  const player = await getPlayerSummary(playerId)
  const updatedPrice = adjustPriceAfterSell(currentPrice)

  await saveInventoryItem(playerId, currentPrice.cheeseName, inventoryItem.quantity - 1)
  await updatePlayerEconomy(playerId, player.cows + currentPrice.sellPrice, player.starterPicksCompleted)
  await upsertTraderPrices([updatedPrice])

  return {
    player: await getPlayerSummary(playerId),
    tradedPrice: currentPrice.sellPrice,
    updatedPrice,
  }
}
