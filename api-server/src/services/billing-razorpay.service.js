const crypto = require('crypto')
const Razorpay = require('razorpay')
const prisma = require('../config/database')
const { getPrimaryBillingAccountForUser } = require('./billing-account.service')
const { getInvoicesForUser, getBillingSummaryForUser } = require('./billing.service')

function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
        const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET')
        err.statusCode = 500
        throw err
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

function toPaise(amount, currency) {
    return Math.round(Number(amount) * 100)
}

async function resolvePayableAmount(user) {
    const invoices = await getInvoicesForUser(user.id)
    const openInvoice = invoices.find((inv) => inv.status === 'OPEN' || inv.status === 'FAILED')

    if (openInvoice) {
        return {
            amountInr: Number(openInvoice.totalInr),
            invoiceId: openInvoice.id,
            reason: 'open_invoice'
        }
    }

    const summary = await getBillingSummaryForUser(user.id)
    return {
        amountInr: Number(summary?.costs?.netSubtotalInr || summary?.costs?.subtotalInr || 0),
        invoiceId: null,
        reason: 'mtd_usage'
    }
}

async function applyPaymentToAccount({
    accountId,
    invoiceId,
    paymentId,
    amountInr,
    status,
    eventType,
    payload
}) {
    const normalizedAmount = Number.isFinite(Number(amountInr)) ? Number(amountInr) : null

    const roundInr = (value) => Math.round(Number(value || 0) * 100) / 100

    if (paymentId) {
        const existing = await prisma.paymentEvent.findFirst({
            where: { stripeObjectId: paymentId }
        })

        if (existing) {
            return existing
        }
    }

    const paymentEvent = await prisma.paymentEvent.create({
        data: {
            accountId,
            invoiceId: invoiceId || null,
            stripeObjectId: paymentId || null,
            status,
            amountInr: normalizedAmount,
            eventType,
            payload
        }
    })

    if (status === 'SUCCESS' && normalizedAmount && normalizedAmount > 0) {
        const account = await prisma.billingAccount.findUnique({
            where: { id: accountId },
            select: { balanceInr: true }
        })
        let newBalance = roundInr(Number(account?.balanceInr || 0) + normalizedAmount)

        if (invoiceId) {
            const invoice = await prisma.invoice.findFirst({
                where: {
                    id: invoiceId,
                    accountId
                }
            })

            if (invoice && (invoice.status === 'OPEN' || invoice.status === 'FAILED')) {
                const invoiceTotal = Number(invoice.totalInr)
                const applied = Math.min(newBalance, invoiceTotal)
                newBalance = roundInr(newBalance - applied)

                if (applied >= invoiceTotal) {
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { status: 'PAID' }
                    })
                }
            }
        }

        await prisma.billingAccount.update({
            where: { id: accountId },
            data: { balanceInr: newBalance }
        })
    }

    return paymentEvent
}

async function createOrderForUser(user, payload = {}) {
    const account = await getPrimaryBillingAccountForUser(user.id)
    const razorpay = getRazorpayClient()

    const resolved = await resolvePayableAmount(user)
    const requestedAmount = payload.amountInr !== undefined ? Number(payload.amountInr) : resolved.amountInr
    const amountInr = Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : 1

    const currency = process.env.RAZORPAY_CURRENCY || 'INR'
    const amountInSubunits = toPaise(amountInr, currency)

    const order = await razorpay.orders.create({
        amount: amountInSubunits,
        currency,
        receipt: `nexus-${Date.now()}`,
        notes: {
            accountId: account.id,
            userId: user.id,
            invoiceId: resolved.invoiceId || '',
            reason: resolved.reason
        }
    })

    return {
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
        amountInr,
        accountId: account.id,
        invoiceId: resolved.invoiceId
    }
}

function validatePaymentSignature(orderId, paymentId, signature) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const body = `${orderId}|${paymentId}`
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
    return expected === signature
}

async function verifyPaymentForUser(user, payload) {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = payload

    if (!orderId || !paymentId || !signature) {
        const err = new Error('Missing Razorpay payment verification parameters')
        err.statusCode = 400
        throw err
    }

    const isValid = validatePaymentSignature(orderId, paymentId, signature)
    if (!isValid) {
        const err = new Error('Invalid Razorpay signature')
        err.statusCode = 400
        throw err
    }

    const account = await getPrimaryBillingAccountForUser(user.id)
    const razorpay = getRazorpayClient()
    const order = await razorpay.orders.fetch(orderId)

    const notes = order?.notes || {}
    const accountId = notes.accountId || account.id
    const invoiceId = notes.invoiceId || null
    const amountInr = order?.amount ? Number(order.amount) / 100 : null

    await applyPaymentToAccount({
        accountId,
        invoiceId,
        paymentId,
        amountInr,
        status: 'SUCCESS',
        eventType: 'razorpay.payment.verified',
        payload: {
            orderId,
            paymentId,
            verifiedAt: new Date().toISOString(),
            order
        }
    })

    return {
        verified: true,
        paymentId,
        orderId
    }
}

function validateWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
        const err = new Error('RAZORPAY_WEBHOOK_SECRET is not configured')
        err.statusCode = 500
        throw err
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    return expected === signature
}

async function handleRazorpayWebhook(rawBody, signature) {
    const isValid = validateWebhookSignature(rawBody, signature)
    if (!isValid) {
        const err = new Error('Invalid Razorpay webhook signature')
        err.statusCode = 400
        throw err
    }

    const event = JSON.parse(rawBody.toString())
    const paymentEntity = event?.payload?.payment?.entity
    const accountId = paymentEntity?.notes?.accountId
    const invoiceId = paymentEntity?.notes?.invoiceId

    if (accountId) {
        await applyPaymentToAccount({
            accountId,
            invoiceId,
            paymentId: paymentEntity.id,
            amountInr: paymentEntity.amount ? Number(paymentEntity.amount) / 100 : null,
            status: paymentEntity.status === 'captured' ? 'SUCCESS' : 'PENDING',
            eventType: `razorpay.${event.event || 'payment_event'}`,
            payload: event
        })
    }

    return {
        received: true,
        event: event.event
    }
}

module.exports = {
    createOrderForUser,
    verifyPaymentForUser,
    handleRazorpayWebhook
}
