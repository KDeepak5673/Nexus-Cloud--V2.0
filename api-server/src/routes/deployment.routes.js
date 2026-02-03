const express = require('express')
const router = express.Router()
const deploymentController = require('../controllers/deployment.controller')
const { requireAuth, verifyAuth } = require('../middlewares/auth.middleware')

// Create deployment (legacy endpoint)
router.post('/deploy', requireAuth, deploymentController.createDeployment)

// Get all deployments for user
router.get('/deployments', requireAuth, deploymentController.getAllDeployments)

// Get deployment status
router.get('/deployments/:deploymentId/status', verifyAuth, deploymentController.getDeploymentStatus)

// Get deployment URL
router.get('/deployments/:deploymentId/url', verifyAuth, deploymentController.getDeploymentUrl)

// Update deployment status
router.patch('/deployments/:id/status', deploymentController.updateDeploymentStatus)

// Simulate deployment process
router.post('/deployments/:id/simulate', deploymentController.simulateDeployment)

module.exports = router
