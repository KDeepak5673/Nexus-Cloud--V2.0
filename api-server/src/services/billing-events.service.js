const { kafka } = require('../config/kafka')
const { usageEventSchema } = require('../schemas/usage-event.schema')

let usageProducer

function getTopicNames() {
    return {
        usageTopic: process.env.BILLING_USAGE_TOPIC || 'billing-usage-events',
        dlqTopic: process.env.BILLING_USAGE_DLQ_TOPIC || 'billing-usage-events-dlq'
    }
}

async function getUsageProducer() {
    if (!usageProducer) {
        usageProducer = kafka.producer({
            allowAutoTopicCreation: true
        })
        await usageProducer.connect()
    }

    return usageProducer
}

async function publishUsageEvent(event) {
    const parsed = usageEventSchema.safeParse(event)
    const producer = await getUsageProducer()
    const { usageTopic, dlqTopic } = getTopicNames()

    if (!parsed.success) {
        await producer.send({
            topic: dlqTopic,
            messages: [
                {
                    key: event?.eventId || `invalid-${Date.now()}`,
                    value: JSON.stringify({
                        reason: 'validation_failed',
                        errors: parsed.error.flatten(),
                        rawEvent: event,
                        createdAt: new Date().toISOString()
                    })
                }
            ]
        })
        return { sent: false, reason: 'validation_failed' }
    }

    await producer.send({
        topic: usageTopic,
        messages: [
            {
                key: parsed.data.eventId,
                value: JSON.stringify(parsed.data)
            }
        ]
    })

    return { sent: true }
}

async function disconnectUsageProducer() {
    if (usageProducer) {
        await usageProducer.disconnect()
        usageProducer = null
    }
}

module.exports = {
    publishUsageEvent,
    disconnectUsageProducer,
    getTopicNames
}
