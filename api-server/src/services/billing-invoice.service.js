const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const prisma = require('../config/database')
const { startOfMonth, addMonths } = require('./billing.service')
const { calculateMetricCharge, roundCurrency } = require('./billing-pricing.service')

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
        doc.text(`Qty: ${Number(item.quantity).toFixed(4)} | Unit: $${Number(item.unitPriceUsd).toFixed(6)} | Amount: $${Number(item.amountUsd).toFixed(2)}`)
        doc.moveDown(0.4)
    })

    doc.moveDown(1)
    doc.fontSize(12).text(`Subtotal: $${Number(invoice.subtotalUsd).toFixed(2)}`)
    doc.text(`Tax: $${Number(invoice.taxUsd).toFixed(2)}`)
    doc.text(`Total: $${Number(invoice.totalUsd).toFixed(2)}`)

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
        EGRESS_MB: 0
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
            unitPriceUsd: charge.unitPriceUsd,
            amountUsd: charge.amountUsd,
            metadata: {
                monthStart: periodStart.toISOString(),
                includedUnits: charge.includedUnits,
                billableUnits: charge.billableUnits
            }
        })
    }

    const subtotalUsd = roundCurrency(draftItems.reduce((sum, item) => sum + item.amountUsd, 0))
    const taxRate = Number(process.env.BILLING_TAX_RATE || 0)
    const taxUsd = roundCurrency(subtotalUsd * taxRate)
    const totalUsd = roundCurrency(subtotalUsd + taxUsd)

    const invoice = await prisma.invoice.create({
        data: {
            accountId,
            periodStart,
            periodEnd,
            status: 'OPEN',
            subtotalUsd,
            taxUsd,
            totalUsd,
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
