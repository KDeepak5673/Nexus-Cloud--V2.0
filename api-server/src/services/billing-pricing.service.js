const prisma = require('../config/database')

function toNumber(value) {
    return Number(value || 0)
}

function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function getMetricFallback(metricType) {
    if (metricType === 'EGRESS_MB') {
        return { unitPriceInr: 0.0083, includedUnits: 1024 }
    }

    if (metricType === 'DEPLOYMENT_COUNT') {
        return { unitPriceInr: 8.3, includedUnits: 10 }
    }

    if (metricType === 'PROJECT_COUNT') {
        return { unitPriceInr: 166.0, includedUnits: 5 }
    }

    return { unitPriceInr: 0.2075, includedUnits: 300 }
}

function isInvalidMetricEnumError(error) {
    const message = String(error?.message || '')
    return error?.code === 'P2010'
        || message.includes('22P02')
        || message.includes('invalid input value for enum "MetricType"')
}

function computeOverageCharge(quantity, includedUnits, alreadyConsumed, unitPriceInr) {
    const qty = toNumber(quantity)
    const included = toNumber(includedUnits)
    const consumed = toNumber(alreadyConsumed)
    const price = toNumber(unitPriceInr)

    const freeLeft = Math.max(0, included - consumed)
    const billableUnits = Math.max(0, qty - freeLeft)
    const amountInr = roundCurrency(billableUnits * price)

    return {
        billableUnits,
        amountInr
    }
}

async function getEffectivePrice(accountId, metricType, at = new Date()) {
    let accountRule
    try {
        accountRule = await prisma.pricingRule.findFirst({
            where: {
                accountId,
                metricType,
                activeFrom: { lte: at },
                OR: [{ activeTo: null }, { activeTo: { gt: at } }]
            },
            orderBy: { activeFrom: 'desc' }
        })
    } catch (error) {
        if (isInvalidMetricEnumError(error)) {
            return getMetricFallback(metricType)
        }
        throw error
    }

    if (accountRule) {
        return {
            unitPriceInr: toNumber(accountRule.unitPriceInr),
            includedUnits: toNumber(accountRule.includedUnits)
        }
    }

    let defaultRule
    try {
        defaultRule = await prisma.pricingRule.findFirst({
            where: {
                accountId: null,
                metricType,
                activeFrom: { lte: at },
                OR: [{ activeTo: null }, { activeTo: { gt: at } }]
            },
            orderBy: { activeFrom: 'desc' }
        })
    } catch (error) {
        if (isInvalidMetricEnumError(error)) {
            return getMetricFallback(metricType)
        }
        throw error
    }

    if (!defaultRule) {
        const fallback = getMetricFallback(metricType)
        return {
            unitPriceInr: fallback.unitPriceInr,
            includedUnits: fallback.includedUnits
        }
    }

    return {
        unitPriceInr: toNumber(defaultRule.unitPriceInr),
        includedUnits: toNumber(defaultRule.includedUnits)
    }
}

async function calculateMetricCharge({ accountId, metricType, quantity, alreadyConsumed = 0, at = new Date() }) {
    const { unitPriceInr, includedUnits } = await getEffectivePrice(accountId, metricType, at)
    const qty = toNumber(quantity)
    const { billableUnits, amountInr } = computeOverageCharge(qty, includedUnits, alreadyConsumed, unitPriceInr)

    return {
        metricType,
        quantity: qty,
        unitPriceInr,
        includedUnits,
        billableUnits,
        amountInr
    }
}

async function getPricingCatalog(accountId) {
    const metrics = ['BUILD_MINUTES', 'EGRESS_MB', 'DEPLOYMENT_COUNT', 'PROJECT_COUNT']
    const result = []

    for (const metricType of metrics) {
        const current = await getEffectivePrice(accountId, metricType)
        result.push({
            metricType,
            unitPriceInr: current.unitPriceInr,
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
