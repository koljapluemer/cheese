import type { ToastTone } from '@/dumb/toast/toastStore'
import {
  getPlayerInventory,
  getPlayerInventoryItem,
  getPlayerSummary,
  saveInventoryItem,
  updatePlayerEconomy,
} from '@/entities/player/playerApi'
import type { PlayerSummary } from '@/entities/player/playerTypes'
import { getTraderTradeEvents } from '@/entities/trader/traderApi'
import { ensureTraderPricesFresh } from '@/features/trader-manage/traderActions'

import type { WheelSegment } from './wheelTypes'

interface WheelRewardResult {
  player: PlayerSummary
  toastMessage: string
  toastTone: ToastTone
}

function pickFiveOrTen() {
  return Math.random() >= 0.5 ? 10 : 5
}

function pickRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function pickRandomCowsAmount() {
  const steps = 16
  return 25 + Math.floor(Math.random() * steps) * 5
}

function buildCheeseRanking(
  currentPrices: Awaited<ReturnType<typeof ensureTraderPricesFresh>>,
  tradeEvents: Awaited<ReturnType<typeof getTraderTradeEvents>>,
) {
  const effectivePrices = new Map<string, number>()

  for (const price of currentPrices) {
    effectivePrices.set(price.cheeseName, price.buyPrice)
  }

  for (const event of tradeEvents) {
    if (event.tradeKind === 'buy') {
      effectivePrices.set(event.cheeseName, event.price)
    }
  }

  return [...effectivePrices.entries()]
    .map(([cheeseName, price]) => ({ cheeseName, price }))
    .sort((left, right) => right.price - left.price || left.cheeseName.localeCompare(right.cheeseName))
}

function pickTopRewardCheeses(
  ranking: Array<{ cheeseName: string; price: number }>,
): [string, string] {
  const pool = ranking.slice(0, Math.min(10, ranking.length))

  if (pool.length < 2) {
    throw new Error('Not enough trader data for the wheel.')
  }

  const first = pickRandomItem(pool)
  const second = pickRandomItem(pool.filter((item) => item.cheeseName !== first.cheeseName))

  return [first.cheeseName, second.cheeseName]
}

function getCheapestTraderCheese(currentPrices: Awaited<ReturnType<typeof ensureTraderPricesFresh>>) {
  return [...currentPrices].sort(
    (left, right) => left.buyPrice - right.buyPrice || left.cheeseName.localeCompare(right.cheeseName),
  )[0]?.cheeseName
}

export async function generateWheelSegments(): Promise<WheelSegment[]> {
  const currentPrices = await ensureTraderPricesFresh()
  const tradeEvents = await getTraderTradeEvents()
  const ranking = buildCheeseRanking(currentPrices, tradeEvents)
  const [firstTopCheese, secondTopCheese] = pickTopRewardCheeses(ranking)
  const cheapestCheese = getCheapestTraderCheese(currentPrices)

  if (!cheapestCheese) {
    throw new Error('Trader offers are not available yet.')
  }

  const topWeightA = pickFiveOrTen()
  const topWeightB = pickFiveOrTen()
  const cowsWeight = pickFiveOrTen()
  const cowsAmount = pickRandomCowsAmount()
  const destroyWeight = 5
  const cheapWeight = 100 - topWeightA - topWeightB - cowsWeight - destroyWeight

  return [
    {
      id: `top-${firstTopCheese}`,
      label: firstTopCheese,
      reward: {
        cheeseName: firstTopCheese,
        kind: 'cheese',
        source: 'top',
      },
      weight: topWeightA,
    },
    {
      id: `top-${secondTopCheese}`,
      label: secondTopCheese,
      reward: {
        cheeseName: secondTopCheese,
        kind: 'cheese',
        source: 'top',
      },
      weight: topWeightB,
    },
    {
      id: 'cows',
      label: `${cowsAmount} cows`,
      reward: {
        cows: cowsAmount,
        kind: 'cows',
      },
      weight: cowsWeight,
    },
    {
      id: 'destroy',
      label: 'Lose 1',
      reward: {
        kind: 'destroy',
      },
      weight: destroyWeight,
    },
    {
      id: `cheap-${cheapestCheese}`,
      label: cheapestCheese,
      reward: {
        cheeseName: cheapestCheese,
        kind: 'cheese',
        source: 'cheap',
      },
      weight: cheapWeight,
    },
  ]
}

export function pickWinningSegment(segments: WheelSegment[]) {
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0)
  let roll = Math.random() * totalWeight

  for (const segment of segments) {
    roll -= segment.weight

    if (roll <= 0) {
      return segment
    }
  }

  return segments[segments.length - 1]
}

export async function applyWheelReward(playerId: string, segment: WheelSegment): Promise<WheelRewardResult> {
  if (segment.reward.kind === 'cheese') {
    const inventoryItem = await getPlayerInventoryItem(playerId, segment.reward.cheeseName)
    await saveInventoryItem(playerId, segment.reward.cheeseName, (inventoryItem?.quantity ?? 0) + 1)

    return {
      player: await getPlayerSummary(playerId),
      toastMessage: `1 ${segment.reward.cheeseName} won.`,
      toastTone: 'success',
    }
  }

  if (segment.reward.kind === 'cows') {
    const player = await getPlayerSummary(playerId)
    await updatePlayerEconomy(playerId, player.cows + segment.reward.cows, player.starterPicksCompleted)

    return {
      player: await getPlayerSummary(playerId),
      toastMessage: `${segment.reward.cows} cows won.`,
      toastTone: 'success',
    }
  }

  const inventory = await getPlayerInventory(playerId)
  const totalCheeses = inventory.reduce((sum, item) => sum + item.quantity, 0)

  if (totalCheeses === 0) {
    return {
      player: await getPlayerSummary(playerId),
      toastMessage: 'Nothing destroyed. Inventory empty.',
      toastTone: 'info',
    }
  }

  let remaining = Math.floor(Math.random() * totalCheeses)
  const destroyedItem = inventory.find((item) => {
    remaining -= item.quantity
    return remaining < 0
  })

  if (!destroyedItem) {
    throw new Error('Could not destroy a cheese.')
  }

  await saveInventoryItem(playerId, destroyedItem.cheeseName, destroyedItem.quantity - 1)

  return {
    player: await getPlayerSummary(playerId),
    toastMessage: `1 ${destroyedItem.cheeseName} destroyed.`,
    toastTone: 'error',
  }
}
