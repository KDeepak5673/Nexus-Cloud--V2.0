const { z } = require('zod')

const usageEventSchema = z.object({
    eventId: z.string().min(6),
    sourceService: z.string().min(2),
    eventType: z.string().min(2),
    accountId: z.string().uuid(),
    workspaceId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
    metricType: z.enum(['BUILD_MINUTES', 'EGRESS_MB']),
    quantity: z.number().positive(),
    timestamp: z.string().datetime(),
    traceId: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable()
})

module.exports = {
    usageEventSchema
}
