import type { FastifyPluginAsync } from 'fastify'
import { getSystemStatus } from '../lib/modelLoader.js'
import { getTelemetry } from '../middleware/telemetry.js'
import type { HealthResponse, SystemStatusValue } from '../types/index.js'

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const caps      = getSystemStatus()
    const telemetry = getTelemetry()

    const activeCount = Object.values(caps).filter(Boolean).length
    const status: SystemStatusValue =
      activeCount === 4 ? 'optimal' :
      activeCount >= 2  ? 'degraded' :
                          'critical'

    const body: HealthResponse = {
      status,
      capabilities:          caps,
      bytesSentToCloud:      0,
      bytesProcessedLocally: telemetry.bytesProcessedLocally,
      queriesProcessed:      telemetry.queriesProcessed,
      uptime:                process.uptime(),
      timestamp:             new Date().toISOString(),
    }

    return reply.send(body)
  })
}
