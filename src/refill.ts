import { getNeonConnection, getSentences, getUpstashConnection } from "./db"

const redisPoolKey = 'dlystc:sentences:pool'

const fillCountHigh = 80000
const fillCountLow = 8000
const fillCountPerCycle = 8000

export interface RefillReport {
  filled: boolean
  previousCount: number
  newCount: number
  cycles: number
  fillCount: number
}

/**
 * Check Redis pool and fill if below threshold.
 * Returns a report of what happened.
 */
export async function refillPoolIfNeeded(): Promise<RefillReport> {
  const upstash = getUpstashConnection()
  const currentCount = await upstash.scard(redisPoolKey)

  let count = currentCount
  let cycles = 0

  if (count < fillCountLow) {
    const neon = getNeonConnection()
    while (count < fillCountHigh) {
      const entries = await getSentences(neon, fillCountPerCycle)
      if (entries.length === 0) {
        break
      }

      const serialised = entries.map(e => JSON.stringify(e))
      await upstash.sadd(redisPoolKey, ...serialised as [string, ...string[]])

      count += entries.length
      cycles++
    }

    const fillCount = count - currentCount

    return {
      filled: true,
      previousCount: currentCount,
      newCount: count,
      cycles,
      fillCount,
    }
  }

  return {
    filled: false,
    previousCount: currentCount,
    newCount: count,
    cycles: 0,
    fillCount: 0,
  }
}