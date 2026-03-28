const prisma = require('../config/database')
const { getPrimaryBillingAccountForUser } = require('./billing-account.service')
const { getPricingCatalog, roundCurrency, calculateMetricCharge, getEffectivePrice } = require('./billing-pricing.service')

function startOfMonth(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
}

function addMonths(date, value) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + value, 1, 0, 0, 0))
}

async function getMonthlyDeploymentAndProjectStats(accountId, periodStart, periodEnd) {
    const projects = await prisma.project.findMany({
        where: {
            billingAccountId: accountId
        },
        select: {
            id: true,
            name: true,
            subDomain: true
        }
    })

    const deploymentRows = await prisma.deployement.findMany({
        where: {
            project: {
                billingAccountId: accountId
            },
            createdAt: {
                gte: periodStart,
                lt: periodEnd
            }
        },
        select: {
            projectId: true
        }
    })

    const deploymentCountsByProject = new Map()
    for (const row of deploymentRows) {
        deploymentCountsByProject.set(row.projectId, (deploymentCountsByProject.get(row.projectId) || 0) + 1)
    }

    return {
        projectCount: projects.length,
        deploymentCount: deploymentRows.length,
        projects,
        deploymentCountsByProject
    }
}

async function calculateDeploymentChargeForProjects(accountId, deploymentCountsByProject, at = new Date()) {
    const pricing = await getEffectivePrice(accountId, 'DEPLOYMENT_COUNT', at)
    const unitPriceInr = Number(pricing.unitPriceInr || 0)
    const includedUnits = Number(pricing.includedUnits || 0)

    let billableUnits = 0
    let amountInr = 0
    let quantity = 0

    for (const count of deploymentCountsByProject.values()) {
        const deployments = Number(count || 0)
        quantity += deployments
        const billable = Math.max(0, deployments - includedUnits)
        billableUnits += billable
        amountInr += billable * unitPriceInr
    }

    return {
        metricType: 'DEPLOYMENT_COUNT',
        quantity,
        unitPriceInr,
        includedUnits,
        billableUnits,
        amountInr: roundCurrency(amountInr)
    }
}

async function getBillingSummaryForUser(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    const periodStart = startOfMonth(new Date())
    const periodEnd = addMonths(periodStart, 1)

    const deploymentAndProjectStats = await getMonthlyDeploymentAndProjectStats(account.id, periodStart, periodEnd)
    const deploymentCharge = await calculateDeploymentChargeForProjects(
        account.id,
        deploymentAndProjectStats.deploymentCountsByProject,
        periodEnd
    )
    const projectCharge = await calculateMetricCharge({
        accountId: account.id,
        metricType: 'PROJECT_COUNT',
        quantity: deploymentAndProjectStats.projectCount,
        alreadyConsumed: 0,
        at: periodEnd
    })

    const monthlyUsage = await prisma.usageAggregateMonthly.findMany({
        where: {
            accountId: account.id,
            monthStart: periodStart
        }
    })

    const byMetric = monthlyUsage.reduce((acc, item) => {
        const key = item.metricType
        if (!acc[key]) {
            acc[key] = { quantity: 0, costInr: 0 }
        }
        acc[key].quantity += Number(item.quantity)
        acc[key].costInr += Number(item.costInr)
        return acc
    }, {})

    byMetric.DEPLOYMENT_COUNT = {
        quantity: deploymentAndProjectStats.deploymentCount,
        costInr: deploymentCharge.amountInr
    }

    byMetric.PROJECT_COUNT = {
        quantity: deploymentAndProjectStats.projectCount,
        costInr: projectCharge.amountInr
    }

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
            acc[key] = { date: key, costInr: 0, buildMinutes: 0, egressMb: 0 }
        }

        const quantity = Number(item.quantity)
        const costInr = Number(item.costInr)
        acc[key].costInr += costInr
        if (item.metricType === 'BUILD_MINUTES') acc[key].buildMinutes += quantity
        if (item.metricType === 'EGRESS_MB') acc[key].egressMb += quantity
        return acc
    }, {})

    const trendRows = Object.values(trend)
    const avgDailyCost = trendRows.length > 0
        ? trendRows.reduce((sum, row) => sum + row.costInr, 0) / trendRows.length
        : 0

    const daysInMonth = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0)).getUTCDate()
    const estimatedMonthEndInr = roundCurrency(avgDailyCost * daysInMonth)

    const subtotalInr = roundCurrency(Object.values(byMetric).reduce((sum, item) => sum + item.costInr, 0))

    const balanceInr = Number(account.balanceInr || 0)
    const balanceAppliedInr = roundCurrency(Math.min(balanceInr, subtotalInr))
    const netSubtotalInr = roundCurrency(Math.max(0, subtotalInr - balanceAppliedInr))
    const balanceRemainingInr = roundCurrency(Math.max(0, balanceInr - subtotalInr))

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
            budgetSoftLimitInr: account.budgetSoftLimitInr,
            budgetHardLimitInr: account.budgetHardLimitInr,
            balanceInr
        },
        cycle: {
            start: periodStart,
            end: periodEnd
        },
        usage: {
            buildMinutes: byMetric.BUILD_MINUTES?.quantity || 0,
            egressMb: byMetric.EGRESS_MB?.quantity || 0,
            deployments: byMetric.DEPLOYMENT_COUNT?.quantity || 0,
            projects: byMetric.PROJECT_COUNT?.quantity || 0
        },
        costs: {
            subtotalInr,
            netSubtotalInr,
            balanceAppliedInr,
            balanceRemainingInr,
            estimatedMonthEndInr,
            deploymentInr: byMetric.DEPLOYMENT_COUNT?.costInr || 0,
            projectsInr: byMetric.PROJECT_COUNT?.costInr || 0
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
    const monthEnd = addMonths(monthStart, 1)
    const deploymentAndProjectStats = await getMonthlyDeploymentAndProjectStats(account.id, monthStart, monthEnd)

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

    for (const project of deploymentAndProjectStats.projects) {
        map.set(project.id, {
            projectId: project.id,
            projectName: project.name,
            subDomain: project.subDomain || null,
            buildMinutes: 0,
            egressMb: 0,
            deploymentCount: deploymentAndProjectStats.deploymentCountsByProject.get(project.id) || 0,
            projectCount: 1,
            costInr: 0
        })
    }

    for (const row of rows) {
        const key = row.projectId || 'unassigned'
        if (!map.has(key)) {
            map.set(key, {
                projectId: row.projectId,
                projectName: row.project?.name || 'Unassigned',
                subDomain: row.project?.subDomain || null,
                buildMinutes: 0,
                egressMb: 0,
                deploymentCount: deploymentAndProjectStats.deploymentCountsByProject.get(row.projectId) || 0,
                projectCount: row.projectId ? 1 : 0,
                costInr: 0
            })
        }

        const bucket = map.get(key)
        if (row.metricType === 'BUILD_MINUTES') bucket.buildMinutes += Number(row.quantity)
        if (row.metricType === 'EGRESS_MB') bucket.egressMb += Number(row.quantity)
        bucket.costInr += Number(row.costInr)
    }

    return Array.from(map.values()).sort((a, b) => b.costInr - a.costInr)
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
    const amountInr = Number(payload.amountInr)
    if (!Number.isFinite(amountInr) || amountInr === 0) {
        const error = new Error('amountInr must be a non-zero number')
        error.statusCode = 400
        throw error
    }

    const adjustment = await prisma.billingAdjustment.create({
        data: {
            accountId: account.id,
            metricType: payload.metricType || null,
            projectId: payload.projectId || null,
            amountInr,
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

async function getPaymentEventsForUser(userId) {
    const account = await getPrimaryBillingAccountForUser(userId)
    return prisma.paymentEvent.findMany({
        where: { accountId: account.id },
        include: {
            invoice: {
                select: { id: true, status: true, totalInr: true, periodStart: true, periodEnd: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
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
    getPaymentEventsForUser,
    startOfMonth,
    addMonths,
    getMonthlyDeploymentAndProjectStats,
    calculateDeploymentChargeForProjects
}
