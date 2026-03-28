const express = require('express')
const billingController = require('../controllers/billing.controller')
const { requireAuth } = require('../middlewares/auth.middleware')
const { billingRateLimiter, attachBillingAccount, requireBillingRole } = require('../middlewares/billing.middleware')

const router = express.Router()

router.use(requireAuth)
router.use(billingRateLimiter)
router.use(attachBillingAccount)

router.get('/summary', billingController.getBillingSummary)
router.get('/usage/timeseries', billingController.getUsageTimeseries)
router.get('/usage/projects', billingController.getProjectUsage)
router.get('/invoices', billingController.getInvoices)
router.get('/invoices/:invoiceId', billingController.getInvoiceDetails)
router.get('/payments', billingController.getPayments)
router.get('/pricing', billingController.getPricingCatalog)
router.post('/razorpay/order', requireBillingRole(['OWNER', 'ADMIN']), billingController.createRazorpayOrder)
router.post('/razorpay/verify', requireBillingRole(['OWNER', 'ADMIN']), billingController.verifyRazorpayPayment)
router.get('/adjustments', requireBillingRole(['OWNER', 'ADMIN']), billingController.getAdjustments)
router.post('/adjustments', requireBillingRole(['OWNER', 'ADMIN']), billingController.createAdjustment)

module.exports = router
