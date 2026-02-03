const express = require('express')
const router = express.Router()
const logsController = require('../controllers/logs.controller')

// Get logs for a deployment
router.get('/logs/:id', logsController.getLogs)

module.exports = router
