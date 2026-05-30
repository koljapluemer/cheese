import { createPlayer } from '@/entities/player/playerApi'

function normalizeNickname(rawNickname: string) {
  return rawNickname.trim().replace(/\s+/g, ' ')
}

export async function registerPlayerName(rawNickname: string) {
  const nickname = normalizeNickname(rawNickname)

  if (!nickname) {
    throw new Error('Enter a name first.')
  }

  if (nickname.length > 24) {
    throw new Error('Keep the name under 24 characters.')
  }

  return createPlayer(nickname)
}

