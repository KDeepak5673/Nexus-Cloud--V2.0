const prisma = require('../config/database')

function toNumber(value) {
    return Number(value || 0)
}

function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function computeOverageCharge(quantity, includedUnits, alreadyConsumed, unitPriceUsd) {
    const qty = toNumber(quantity)
    const included = toNumber(includedUnits)
    const consumed = toNumber(alreadyConsumed)
    const price = toNumber(unitPriceUsd)

    const freeLeft = Math.max(0, included - consumed)
    const billableUnits = Math.max(0, qty - freeLeft)
    const amountUsd = roundCurrency(billableUnits * price)

    return {
        billableUnits,
        amountUsd
    }
}

async function getEffectivePrice(accountId, metricType, at = new Date()) {
    const accountRule = await prisma.pricingRule.findFirst({
        where: {
            accountId,
            metricType,
            activeFrom: { lte: at },
            OR: [{ activeTo: null }, { activeTo: { gt: at } }]
        },
        orderBy: { activeFrom: 'desc' }
    })

    if (accountRule) {
        return {
            unitPriceUsd: toNumber(accountRule.unitPriceUsd),
            includedUnits: toNumber(accountRule.includedUnits)
        }
    }

    const defaultRule = await prisma.pricingRule.findFirst({
        where: {
            accountId: null,
            metricType,
            activeFrom: { lte: at },
            OR: [{ activeTo: null }, { activeTo: { gt: at } }]
        },
        orderBy: { activeFrom: 'desc' }
    })

    if (!defaultRule) {
        return {
            unitPriceUsd: metricType === 'EGRESS_MB' ? 0.0001 : 0.0025,
            includedUnits: metricType === 'EGRESS_MB' ? 10240 : 300
        }
    }

    return {
        unitPriceUsd: toNumber(defaultRule.unitPriceUsd),
        includedUnits: toNumber(defaultRule.includedUnits)
    }
}

async function calculateMetricCharge({ accountId, metricType, quantity, alreadyConsumed = 0, at = new Date() }) {
    const { unitPriceUsd, includedUnits } = await getEffectivePrice(accountId, metricType, at)
    const qty = toNumber(quantity)
    const { billableUnits, amountUsd } = computeOverageCharge(qty, includedUnits, alreadyConsumed, unitPriceUsd)

    return {
        metricType,
        quantity: qty,
        unitPriceUsd,
        includedUnits,
        billableUnits,
        amountUsd
    }
}

async function getPricingCatalog(accountId) {
    const metrics = ['BUILD_MINUTES', 'EGRESS_MB']
    const result = []

    for (const metricType of metrics) {
        const current = await getEffectivePrice(accountId, metricType)
        result.push({
            metricType,
            unitPriceUsd: current.unitPriceUsd,
            includedUnits: current.includedUnits
        })
    }

    return result
}

module.exports = {
    calculateMetricCharge,
    getEffectivePrice,
    getPricingCatalog,
    roundCurrency,
    computeOverageCharge
}
