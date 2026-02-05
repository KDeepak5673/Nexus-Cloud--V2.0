const express = require('express')
const router = express.Router()
const analyticsController = require('../controllers/analytics.controller')

// Get platform analytics
router.get('/analytics', analyticsController.getAnalytics)

// Resolve subdomain
router.get('/resolve/:subdomain', analyticsController.resolveSubdomain)

module.exports = router
