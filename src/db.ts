import { Redis } from '@upstash/redis'
import { env } from 'cloudflare:workers'
import postgres from 'postgres'

export interface SentenceRow {
  uuid: string
  sentence: string
  category: string
  source: string | null
  author: string | null
  created_at: Date | null
}

/** The shape stored in Redis */
export interface SentenceEntry {
  content: string
  source: string | null
  author: string | null
  created_at: string | null
}

export function getNeonConnection() {
  return postgres(env.HYPERDRIVE!.connectionString)
}

export function getUpstashConnection() {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  })
}

export async function getSentences(conn: postgres.Sql, count: number = 1000): Promise<SentenceEntry[]> {
  const rows = await conn<SentenceRow[]>`
    with total as (select count(*) as cnt from sentences)
    select uuid, sentence, source, author, created_at
    from sentences
    tablesample system((select ${count} / (cnt / 100.0) from total))
    order by random()
  `

  return rows.map(r => ({
    content: r.sentence,
    source: r.source ?? null,
    author: r.author ?? null,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
  }))
}