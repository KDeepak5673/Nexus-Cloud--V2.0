const express = require('express')
const router = express.Router()
const analyticsController = require('../controllers/analytics.controller')
const { requireAuth } = require('../middlewares/auth.middleware')

// Get platform analytics
router.get('/analytics', analyticsController.getAnalytics)

// Resolve subdomain
router.get('/resolve/:subdomain', analyticsController.resolveSubdomain)

// Dashboard endpoints (require authentication)
router.get('/dashboard/stats', requireAuth, analyticsController.getDashboardStats)
router.get('/dashboard/activity', requireAuth, analyticsController.getDeploymentActivity)
router.get('/dashboard/trend', requireAuth, analyticsController.getSuccessFailureTrend)
router.get('/dashboard/deployments', requireAuth, analyticsController.getRecentDeployments)

module.exports = router
