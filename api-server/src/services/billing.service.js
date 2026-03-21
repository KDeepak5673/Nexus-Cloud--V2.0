const prisma = require('../config/database')
const { getPrimaryBillingAccountForUser } = require('./billing-account.service')
const { getPricingCatalog, roundCurrency } = require('./billing-pricing.service')

function startOfMonth(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
}

function addMonths(date, value) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + value, 1, 0, 0, 0))
}

async function getBillingSummaryForUser(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    const periodStart = startOfMonth(new Date())
    const periodEnd = addMonths(periodStart, 1)

    const monthlyUsage = await prisma.usageAggregateMonthly.findMany({
        where: {
            accountId: account.id,
            monthStart: periodStart
        }
    })

    const byMetric = monthlyUsage.reduce((acc, item) => {
        const key = item.metricType
        if (!acc[key]) {
            acc[key] = { quantity: 0, costUsd: 0 }
        }
        acc[key].quantity += Number(item.quantity)
        acc[key].costUsd += Number(item.costUsd)
        return acc
    }, {})

    const dailyLast7 = await prisma.usageAggregateDaily.findMany({
        where: {
            accountId: account.id,
            bucketDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
        },
        orderBy: { bucketDate: 'asc' }
    })

    const trend = dailyLast7.reduce((acc, item) => {
        const key = item.bucketDate.toISOString().slice(0, 10)
        if (!acc[key]) {
            acc[key] = { date: key, costUsd: 0, buildMinutes: 0, egressMb: 0 }
        }

        const quantity = Number(item.quantity)
        const costUsd = Number(item.costUsd)
        acc[key].costUsd += costUsd
        if (item.metricType === 'BUILD_MINUTES') acc[key].buildMinutes += quantity
        if (item.metricType === 'EGRESS_MB') acc[key].egressMb += quantity
        return acc
    }, {})

    const trendRows = Object.values(trend)
    const avgDailyCost = trendRows.length > 0
        ? trendRows.reduce((sum, row) => sum + row.costUsd, 0) / trendRows.length
        : 0

    const daysInMonth = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0)).getUTCDate()
    const dayOfMonth = new Date().getUTCDate()
    const estimatedMonthEndUsd = roundCurrency(avgDailyCost * daysInMonth)

    const subtotalUsd = roundCurrency(Object.values(byMetric).reduce((sum, item) => sum + item.costUsd, 0))

    const quotas = await prisma.quotaPolicy.findMany({
        where: { accountId: account.id }
    })

    const alerts = quotas.map((quota) => {
        const consumed = byMetric[quota.metricType]?.quantity || 0
        const included = Number(quota.monthlyIncluded)
        const percentage = included > 0 ? (consumed / included) * 100 : 0
        return {
            metricType: quota.metricType,
            consumed,
            included,
            percentage: Math.round(percentage),
            level: percentage >= quota.hardLimitPercent ? 'hard' : percentage >= quota.softLimitPercent ? 'soft' : 'ok'
        }
    })

    return {
        account: {
            id: account.id,
            name: account.name,
            currency: account.currency,
            budgetSoftLimitUsd: account.budgetSoftLimitUsd,
            budgetHardLimitUsd: account.budgetHardLimitUsd
        },
        cycle: {
            start: periodStart,
            end: periodEnd
        },
        usage: {
            buildMinutes: byMetric.BUILD_MINUTES?.quantity || 0,
            egressMb: byMetric.EGRESS_MB?.quantity || 0
        },
        costs: {
            subtotalUsd,
            estimatedMonthEndUsd
        },
        alerts,
        trend: trendRows
    }
}

async function getUsageTimeseries(userId, days = 30) {
    const account = await getPrimaryBillingAccountForUser(userId)
    return prisma.usageAggregateDaily.findMany({
        where: {
            accountId: account.id,
            bucketDate: {
                gte: new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000)
            }
        },
        orderBy: { bucketDate: 'asc' }
    })
}

async function getProjectUsageBreakdown(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    const monthStart = startOfMonth(new Date())

    const rows = await prisma.usageAggregateMonthly.findMany({
        where: {
            accountId: account.id,
            monthStart
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    subDomain: true
                }
            }
        }
    })

    const map = new Map()
    for (const row of rows) {
        const key = row.projectId || 'unassigned'
        if (!map.has(key)) {
            map.set(key, {
                projectId: row.projectId,
                projectName: row.project?.name || 'Unassigned',
                subDomain: row.project?.subDomain || null,
                buildMinutes: 0,
                egressMb: 0,
                costUsd: 0
            })
        }

        const bucket = map.get(key)
        if (row.metricType === 'BUILD_MINUTES') bucket.buildMinutes += Number(row.quantity)
        if (row.metricType === 'EGRESS_MB') bucket.egressMb += Number(row.quantity)
        bucket.costUsd += Number(row.costUsd)
    }

    return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd)
}

async function getInvoicesForUser(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    return prisma.invoice.findMany({
        where: { accountId: account.id },
        include: {
            lineItems: true
        },
        orderBy: { periodStart: 'desc' }
    })
}

async function getInvoiceDetailsForUser(userId, invoiceId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    const invoice = await prisma.invoice.findFirst({
        where: {
            id: invoiceId,
            accountId: account.id
        },
        include: {
            lineItems: true
        }
    })

    if (!invoice) {
        const error = new Error('Invoice not found')
        error.statusCode = 404
        throw error
    }

    return invoice
}

async function getPricingForUser(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    return getPricingCatalog(account.id)
}

async function createBillingAdjustment(userId, payload) {
    const account = await getPrimaryBillingAccountForUser(userId)
    const amountUsd = Number(payload.amountUsd)
    if (!Number.isFinite(amountUsd) || amountUsd === 0) {
        const error = new Error('amountUsd must be a non-zero number')
        error.statusCode = 400
        throw error
    }

    const adjustment = await prisma.billingAdjustment.create({
        data: {
            accountId: account.id,
            metricType: payload.metricType || null,
            projectId: payload.projectId || null,
            amountUsd,
            reason: payload.reason || 'Manual billing adjustment',
            notes: payload.notes || null,
            createdByUserId: userId
        }
    })

    return adjustment
}

async function getBillingAdjustments(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    return prisma.billingAdjustment.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 100
    })
}

module.exports = {
    getBillingSummaryForUser,
    getUsageTimeseries,
    getProjectUsageBreakdown,
    getInvoicesForUser,
    getInvoiceDetailsForUser,
    getPricingForUser,
    createBillingAdjustment,
    getBillingAdjustments,
    startOfMonth,
    addMonths
}
