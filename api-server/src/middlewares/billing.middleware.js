const rateLimit = require('express-rate-limit')
const { getPrimaryBillingAccountForUser, getBillingRole } = require('../services/billing-account.service')

const billingRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many billing API requests, please retry later.'
    }
})

async function attachBillingAccount(req, res, next) {
    try {
        const account = await getPrimaryBillingAccountForUser(req.user.id)
        req.billingAccount = account
        next()
    } catch (error) {
        next(error)
    }
}

function requireBillingRole(allowedRoles = ['OWNER', 'ADMIN']) {
    return async function billingRoleGuard(req, res, next) {
        try {
            const accountId = req.billingAccount?.id
            const role = await getBillingRole(req.user.id, accountId)

            if (!role || !allowedRoles.includes(role)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Insufficient billing permissions.'
                })
            }

            req.billingRole = role
            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = {
    billingRateLimiter,
    attachBillingAccount,
    requireBillingRole
}
