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
    if ((currency || '').toUpperCase() === 'INR') {
        return Math.round(Number(amount) * 100)
    }

    const usdToInr = Number(process.env.USD_TO_INR || 83)
    return Math.round(Number(amount) * usdToInr * 100)
}

async function resolvePayableAmount(user) {
    const invoices = await getInvoicesForUser(user.id)
    const openInvoice = invoices.find((inv) => inv.status === 'OPEN' || inv.status === 'FAILED')

    if (openInvoice) {
        return {
            amountUsd: Number(openInvoice.totalUsd),
            invoiceId: openInvoice.id,
            reason: 'open_invoice'
        }
    }

    const summary = await getBillingSummaryForUser(user.id)
    return {
        amountUsd: Number(summary?.costs?.subtotalUsd || 0),
        invoiceId: null,
        reason: 'mtd_usage'
    }
}

async function createOrderForUser(user, payload = {}) {
    const account = await getPrimaryBillingAccountForUser(user.id)
    const razorpay = getRazorpayClient()

    const resolved = await resolvePayableAmount(user)
    const requestedAmount = payload.amountUsd !== undefined ? Number(payload.amountUsd) : resolved.amountUsd
    const amountUsd = Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : 1

    const currency = process.env.RAZORPAY_CURRENCY || 'INR'
    const amountInSubunits = toPaise(amountUsd, currency)

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
        amountUsd,
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

    await prisma.paymentEvent.create({
        data: {
            accountId: account.id,
            stripeObjectId: paymentId,
            status: 'SUCCESS',
            eventType: 'razorpay.payment.verified',
            payload: {
                orderId,
                paymentId,
                verifiedAt: new Date().toISOString()
            }
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

    if (accountId) {
        await prisma.paymentEvent.create({
            data: {
                accountId,
                stripeObjectId: paymentEntity.id,
                status: paymentEntity.status === 'captured' ? 'SUCCESS' : 'PENDING',
                eventType: `razorpay.${event.event || 'payment_event'}`,
                amountUsd: paymentEntity.amount ? Number(paymentEntity.amount) / 100 : null,
                payload: event
            }
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
