const { successResponse } = require('../utils/response')
const billingService = require('../services/billing.service')
const razorpayService = require('../services/billing-razorpay.service')

async function getBillingSummary(req, res, next) {
    try {
        const summary = await billingService.getBillingSummaryForUser(req.user.id)
        return successResponse(res, summary)
    } catch (error) {
        next(error)
    }
}

async function getUsageTimeseries(req, res, next) {
    try {
        const days = Number(req.query.days || 30)
        const data = await billingService.getUsageTimeseries(req.user.id, days)
        return successResponse(res, { rows: data })
    } catch (error) {
        next(error)
    }
}

async function getProjectUsage(req, res, next) {
    try {
        const rows = await billingService.getProjectUsageBreakdown(req.user.id)
        return successResponse(res, { rows })
    } catch (error) {
        next(error)
    }
}

async function getInvoices(req, res, next) {
    try {
        const invoices = await billingService.getInvoicesForUser(req.user.id)
        return successResponse(res, { invoices })
    } catch (error) {
        next(error)
    }
}

async function getInvoiceDetails(req, res, next) {
    try {
        const invoice = await billingService.getInvoiceDetailsForUser(req.user.id, req.params.invoiceId)
        return successResponse(res, { invoice })
    } catch (error) {
        next(error)
    }
}

async function getPricingCatalog(req, res, next) {
    try {
        const pricing = await billingService.getPricingForUser(req.user.id)
        return successResponse(res, { pricing })
    } catch (error) {
        next(error)
    }
}

async function createAdjustment(req, res, next) {
    try {
        const adjustment = await billingService.createBillingAdjustment(req.user.id, req.body)
        return successResponse(res, { adjustment }, 'Adjustment recorded')
    } catch (error) {
        next(error)
    }
}

async function getAdjustments(req, res, next) {
    try {
        const adjustments = await billingService.getBillingAdjustments(req.user.id)
        return successResponse(res, { adjustments })
    } catch (error) {
        next(error)
    }
}

async function createRazorpayOrder(req, res, next) {
    try {
        const data = await razorpayService.createOrderForUser(req.user, req.body || {})
        return successResponse(res, data)
    } catch (error) {
        next(error)
    }
}

async function verifyRazorpayPayment(req, res, next) {
    try {
        const result = await razorpayService.verifyPaymentForUser(req.user, req.body || {})
        return successResponse(res, result)
    } catch (error) {
        next(error)
    }
}

async function razorpayWebhook(req, res, next) {
    try {
        const signature = req.headers['x-razorpay-signature']
        const result = await razorpayService.handleRazorpayWebhook(req.rawBody, signature)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getBillingSummary,
    getUsageTimeseries,
    getProjectUsage,
    getInvoices,
    getInvoiceDetails,
    getPricingCatalog,
    createAdjustment,
    getAdjustments,
    createRazorpayOrder,
    verifyRazorpayPayment,
    razorpayWebhook
}
