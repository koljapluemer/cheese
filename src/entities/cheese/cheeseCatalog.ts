import cheeseCatalog from '@/db/cheeses.json'

interface CheeseSource {
  image: string
  license: string
  power?: number
  source: string
}

export interface Cheese {
  imagePath: string
  license: string
  name: string
  power: number
  source: string
}

const cheeses = Object.entries(cheeseCatalog as Record<string, CheeseSource>).map(
  ([name, cheese]) => ({
    imagePath: cheese.image.replace(/^public/, ''),
    license: cheese.license,
    name,
    power: cheese.power ?? 5,
    source: cheese.source,
  }),
)

export function getAllCheeses() {
  return cheeses
}

export function getCheeseByName(name: string) {
  return cheeses.find((cheese) => cheese.name === name) ?? null
}

export function getRandomCheesePair() {
  const firstIndex = Math.floor(Math.random() * cheeses.length)
  let secondIndex = Math.floor(Math.random() * cheeses.length)

  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * cheeses.length)
  }

  return [cheeses[firstIndex], cheeses[secondIndex]]
}
