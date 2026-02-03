
const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')

router.post('/register', authController.register)
router.get('/user/:firebaseUid', authController.getUser)

module.exports = router