require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { Kafka, logLevel } = require('kafkajs')
const prisma = require('../config/database')
const { usageEventSchema } = require('../schemas/usage-event.schema')
const { getEffectivePrice } = require('../services/billing-pricing.service')

// const kafka = new Kafka({
//     clientId: process.env.BILLING_WORKER_CLIENT_ID || 'billing-usage-worker',
//     brokers: [process.env.KAFKA_BROKER],
//     logLevel: logLevel.WARN,
//     ssl: {
//         ca: [fs.readFileSync(path.join(__dirname, '../../kafka.pem'), 'utf-8')],
//         rejectUnauthorized: false
//     },
//     sasl: {
//         username: process.env.KAFKA_USERNAME || 'avnadmin',
//         password: process.env.KAFKA_PASSWORD,
//         mechanism: 'plain'
//     }
// })
const kafka = new Kafka({
    clientId: process.env.BILLING_WORKER_CLIENT_ID || 'billing-usage-worker', // Identifies this application to Kafka
    brokers: [process.env.KAFKA_BROKER], // Kafka server address (e.g., "139.59.42.26:17290")

    logLevel: logLevel.WARN, // Reduce log noise (only show warnings and errors)

    // SSL/TLS Configuration for secure connection
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, '../../kafka.pem'), 'utf-8')], // Certificate file
        rejectUnauthorized: false  // Accept self-signed certificates (dev only!)
    },

    // Authentication (username/password)
    sasl: {
        username: process.env.KAFKA_USERNAME || 'avnadmin',
        password: process.env.KAFKA_PASSWORD,
        mechanism: 'plain' // Authentication method
    },

    // Connection settings
    connectionTimeout: 10000,  // Wait 10 seconds for connection
    requestTimeout: 30000,     // Wait 30 seconds for requests

    // Retry configuration (auto-retry on connection failures)
    retry: {
        initialRetryTime: 300,   // Start with 300ms wait
        retries: 10,             // Try 10 times before giving up
        maxRetryTime: 30000,     // Maximum 30 seconds between retries
        multiplier: 2,           // Double the wait time each retry (exponential backoff)
        factor: 0.2              // Add randomness to avoid thundering herd
    }
})

const consumer = kafka.consumer({ groupId: process.env.BILLING_USAGE_CONSUMER_GROUP || 'billing-usage-consumer-v1' })
const producer = kafka.producer({ allowAutoTopicCreation: true })
let workerStarted = false

const usageTopic = process.env.BILLING_USAGE_TOPIC || 'billing-usage-events'
const dlqTopic = process.env.BILLING_USAGE_DLQ_TOPIC || 'billing-usage-events-dlq'

function startOfHour(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), 0, 0))
}

function startOfDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
}

function startOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
}

async function deadLetterMessage(payload, reason) {
    await producer.send({
        topic: dlqTopic,
        messages: [{
            key: payload?.eventId || `dead-${Date.now()}`,
            value: JSON.stringify({ reason, payload, createdAt: new Date().toISOString() })
        }]
    })
}

async function upsertAggregate(tx, tableName, where, createData, updateData) {
    return tx[tableName].upsert({
        where,
        create: createData,
        update: updateData
    })
}

async function processUsageEvent(event) {
    const parsed = usageEventSchema.safeParse(event)
    if (!parsed.success) {
        await deadLetterMessage(event, 'schema_validation_failed')
        return
    }

    const data = parsed.data
    const occurredAt = new Date(data.timestamp)

    const existing = await prisma.usageEventRaw.findUnique({ where: { eventId: data.eventId } })
    if (existing) {
        return
    }

    const account = await prisma.billingAccount.findUnique({ where: { id: data.accountId } })
    if (!account) {
        await deadLetterMessage(data, 'billing_account_not_found')
        return
    }

    const { unitPriceUsd } = await getEffectivePrice(data.accountId, data.metricType, occurredAt)
    const quantity = Number(data.quantity)
    const costUsd = quantity * unitPriceUsd

    await prisma.$transaction(async (tx) => {
        await tx.usageEventRaw.create({
            data: {
                eventId: data.eventId,
                sourceService: data.sourceService,
                eventType: data.eventType,
                accountId: data.accountId,
                workspaceId: data.workspaceId || null,
                projectId: data.projectId || null,
                metricType: data.metricType,
                quantity,
                occurredAt,
                traceId: data.traceId || null,
                metadata: data.metadata || {},
                processedAt: new Date()
            }
        })

        await upsertAggregate(
            tx,
            'usageAggregateHourly',
            {
                accountId_projectId_metricType_bucketStart: {
                    accountId: data.accountId,
                    projectId: data.projectId || null,
                    metricType: data.metricType,
                    bucketStart: startOfHour(occurredAt)
                }
            },
            {
                accountId: data.accountId,
                workspaceId: data.workspaceId || null,
                projectId: data.projectId || null,
                metricType: data.metricType,
                bucketStart: startOfHour(occurredAt),
                quantity,
                unitCostUsd: unitPriceUsd,
                costUsd
            },
            {
                quantity: { increment: quantity },
                costUsd: { increment: costUsd },
                unitCostUsd: unitPriceUsd
            }
        )

        await upsertAggregate(
            tx,
            'usageAggregateDaily',
            {
                accountId_projectId_metricType_bucketDate: {
                    accountId: data.accountId,
                    projectId: data.projectId || null,
                    metricType: data.metricType,
                    bucketDate: startOfDay(occurredAt)
                }
            },
            {
                accountId: data.accountId,
                workspaceId: data.workspaceId || null,
                projectId: data.projectId || null,
                metricType: data.metricType,
                bucketDate: startOfDay(occurredAt),
                quantity,
                unitCostUsd: unitPriceUsd,
                costUsd
            },
            {
                quantity: { increment: quantity },
                costUsd: { increment: costUsd },
                unitCostUsd: unitPriceUsd
            }
        )

        await upsertAggregate(
            tx,
            'usageAggregateMonthly',
            {
                accountId_projectId_metricType_monthStart: {
                    accountId: data.accountId,
                    projectId: data.projectId || null,
                    metricType: data.metricType,
                    monthStart: startOfMonth(occurredAt)
                }
            },
            {
                accountId: data.accountId,
                workspaceId: data.workspaceId || null,
                projectId: data.projectId || null,
                metricType: data.metricType,
                monthStart: startOfMonth(occurredAt),
                quantity,
                unitCostUsd: unitPriceUsd,
                costUsd
            },
            {
                quantity: { increment: quantity },
                costUsd: { increment: costUsd },
                unitCostUsd: unitPriceUsd
            }
        )
    })
}

async function runWorker() {
    if (workerStarted) {
        return
    }

    await consumer.connect()
    await producer.connect()
    await consumer.subscribe({ topic: usageTopic, fromBeginning: true })

    console.log(`Billing worker subscribed to ${usageTopic}`)
    workerStarted = true

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                if (!message.value) return
                const payload = JSON.parse(message.value.toString())
                await processUsageEvent(payload)
            } catch (error) {
                console.error('billing worker message processing failed:', error.message)
                try {
                    await deadLetterMessage({
                        rawValue: message.value?.toString(),
                        key: message.key?.toString()
                    }, 'runtime_error')
                } catch (dlqError) {
                    console.error('billing worker DLQ failed:', dlqError.message)
                }
            }
        }
    })
}

async function stopWorker() {
    if (!workerStarted) {
        return
    }

    await Promise.allSettled([
        consumer.disconnect(),
        producer.disconnect()
    ])

    workerStarted = false
}

module.exports = {
    runWorker,
    stopWorker
}

if (require.main === module) {
    runWorker().catch((error) => {
        console.error('billing usage worker failed to start:', error)
        process.exit(1)
    })
}
