const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const prisma = require('../config/database')
const { startOfMonth, addMonths, getMonthlyDeploymentAndProjectStats, calculateDeploymentChargeForProjects } = require('./billing.service')
const { calculateMetricCharge, roundCurrency } = require('./billing-pricing.service')

function formatInr(value) {
    return `Rs. ${Number(value || 0).toFixed(2)}`
}

function getInvoiceDir() {
    const dir = path.join(process.cwd(), 'artifacts', 'invoices')
    fs.mkdirSync(dir, { recursive: true })
    return dir
}

async function generateInvoicePdf(invoice, lineItems, accountName) {
    const dir = getInvoiceDir()
    const filePath = path.join(dir, `${invoice.id}.pdf`)

    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    doc.fontSize(20).text('Nexus Cloud - Usage Invoice')
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Invoice ID: ${invoice.id}`)
    doc.text(`Account: ${accountName}`)
    doc.text(`Period: ${invoice.periodStart.toISOString().slice(0, 10)} to ${invoice.periodEnd.toISOString().slice(0, 10)}`)
    doc.text(`Status: ${invoice.status}`)
    doc.moveDown(1)

    doc.fontSize(13).text('Line Items', { underline: true })
    doc.moveDown(0.5)

    lineItems.forEach((item) => {
        doc.fontSize(10).text(`${item.description}`)
        doc.text(`Qty: ${Number(item.quantity).toFixed(4)} | Unit: ${formatInr(item.unitPriceInr)} | Amount: ${formatInr(item.amountInr)}`)
        doc.moveDown(0.4)
    })

    doc.moveDown(1)
    doc.fontSize(12).text(`Subtotal: ${formatInr(invoice.subtotalInr)}`)
    doc.text(`Tax: ${formatInr(invoice.taxInr)}`)
    doc.text(`Total: ${formatInr(invoice.totalInr)}`)

    doc.end()

    await new Promise((resolve, reject) => {
        stream.on('finish', resolve)
        stream.on('error', reject)
    })

    return filePath
}

async function finalizeMonthlyInvoice(accountId, date = new Date()) {
    const periodStart = startOfMonth(date)
    const periodEnd = addMonths(periodStart, 1)

    const existing = await prisma.invoice.findFirst({
        where: {
            accountId,
            periodStart,
            periodEnd
        },
        include: { lineItems: true }
    })

    if (existing) {
        return existing
    }

    const usageRows = await prisma.usageAggregateMonthly.findMany({
        where: {
            accountId,
            monthStart: periodStart
        },
        include: {
            project: true
        }
    })

    const metricConsumedMap = {
        BUILD_MINUTES: 0,
        EGRESS_MB: 0,
        DEPLOYMENT_COUNT: 0,
        PROJECT_COUNT: 0
    }

    const draftItems = []
    for (const row of usageRows) {
        const charge = await calculateMetricCharge({
            accountId,
            metricType: row.metricType,
            quantity: Number(row.quantity),
            alreadyConsumed: metricConsumedMap[row.metricType],
            at: periodEnd
        })

        metricConsumedMap[row.metricType] += Number(row.quantity)

        draftItems.push({
            metricType: row.metricType,
            projectId: row.projectId,
            description: `${row.metricType} usage for ${row.project?.name || 'Unassigned project'}`,
            quantity: Number(row.quantity),
            unitPriceInr: charge.unitPriceInr,
            amountInr: charge.amountInr,
            metadata: {
                monthStart: periodStart.toISOString(),
                includedUnits: charge.includedUnits,
                billableUnits: charge.billableUnits
            }
        })
    }

    const deploymentAndProjectStats = await getMonthlyDeploymentAndProjectStats(accountId, periodStart, periodEnd)

    const deploymentCharge = await calculateDeploymentChargeForProjects(
        accountId,
        deploymentAndProjectStats.deploymentCountsByProject,
        periodEnd
    )
    metricConsumedMap.DEPLOYMENT_COUNT += deploymentAndProjectStats.deploymentCount

    draftItems.push({
        metricType: 'DEPLOYMENT_COUNT',
        projectId: null,
        description: 'Monthly deployment count charge',
        quantity: deploymentAndProjectStats.deploymentCount,
        unitPriceInr: deploymentCharge.unitPriceInr,
        amountInr: deploymentCharge.amountInr,
        metadata: {
            monthStart: periodStart.toISOString(),
            includedUnitsPerProject: deploymentCharge.includedUnits,
            billableUnits: deploymentCharge.billableUnits
        }
    })

    const projectCharge = await calculateMetricCharge({
        accountId,
        metricType: 'PROJECT_COUNT',
        quantity: deploymentAndProjectStats.projectCount,
        alreadyConsumed: metricConsumedMap.PROJECT_COUNT,
        at: periodEnd
    })
    metricConsumedMap.PROJECT_COUNT += deploymentAndProjectStats.projectCount

    draftItems.push({
        metricType: 'PROJECT_COUNT',
        projectId: null,
        description: 'Monthly project count charge',
        quantity: deploymentAndProjectStats.projectCount,
        unitPriceInr: projectCharge.unitPriceInr,
        amountInr: projectCharge.amountInr,
        metadata: {
            monthStart: periodStart.toISOString(),
            includedUnits: projectCharge.includedUnits,
            billableUnits: projectCharge.billableUnits
        }
    })

    const subtotalInr = roundCurrency(draftItems.reduce((sum, item) => sum + item.amountInr, 0))
    const taxRate = Number(process.env.BILLING_TAX_RATE || 0)
    const taxInr = roundCurrency(subtotalInr * taxRate)
    const totalInr = roundCurrency(subtotalInr + taxInr)

    const invoice = await prisma.invoice.create({
        data: {
            accountId,
            periodStart,
            periodEnd,
            status: 'OPEN',
            subtotalInr,
            taxInr,
            totalInr,
            snapshotJson: {
                periodStart,
                periodEnd,
                taxRate,
                generatedAt: new Date().toISOString()
            },
            lineItems: {
                create: draftItems
            }
        },
        include: {
            lineItems: true,
            billingAccount: true
        }
    })

    const pdfPath = await generateInvoicePdf(invoice, invoice.lineItems, invoice.billingAccount.name)

    await prisma.invoice.update({
        where: { id: invoice.id },
        data: { externalPdfUrl: pdfPath }
    })

    return invoice
}

module.exports = {
    finalizeMonthlyInvoice,
    generateInvoicePdf
}
