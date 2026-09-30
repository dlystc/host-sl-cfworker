import { fromHono } from "chanfana"
import { Env, Hono } from "hono"
import { DebugGetSentences } from "./endpoints/sentence/get-test"
import { RefillPool } from "./endpoints/sentence/refill-pool"
import { refillPoolIfNeeded } from "./refill"

const app = new Hono<{ Bindings: Env }>()

const openapi = fromHono(app, {
  docs_url: "/swagger"
})

openapi.get("/api/sentences/test", DebugGetSentences)
openapi.post("/api/sentences/refill", RefillPool)

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const entry = { timestamp, level, message, ...meta }
  console.log(JSON.stringify(entry))
}

export default {
  ...app,

  async scheduled(event: unknown, env: unknown, ctx: unknown) {
    try {
      const report = await refillPoolIfNeeded()
      if (!report.filled) {
        log('info', 'Redis sentence pool sufficient, no refill needed', {
          currentCount: report.previousCount,
        })
      } else {
        log('info', 'Redis sentence pool refilled via cron', report)
      }
    } catch (err) {
      log('error', 'Failed to refill Redis sentence pool', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}