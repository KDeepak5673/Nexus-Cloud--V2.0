require('dotenv').config()

const prisma = require('../config/database')
const { finalizeMonthlyInvoice } = require('../services/billing-invoice.service')

async function runMonthEndJob() {
    const now = new Date()
    const accounts = await prisma.billingAccount.findMany({ select: { id: true } })

    for (const account of accounts) {
        try {
            const invoice = await finalizeMonthlyInvoice(account.id, now)
            console.log(`invoice finalized for account ${account.id}: ${invoice.id}`)
        } catch (error) {
            console.error(`invoice generation failed for account ${account.id}:`, error.message)
        }
    }
}

module.exports = {
    runMonthEndJob
}

if (require.main === module) {
    runMonthEndJob()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}
