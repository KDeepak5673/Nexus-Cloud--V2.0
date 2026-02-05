const analyticsService = require('../services/analytics.service')

async function getAnalytics(req, res, next) {
    try {
        const analytics = await analyticsService.getPlatformAnalytics()

        return res.json({
            status: 'success',
            data: analytics
        })
    } catch (error) {
        next(error)
    }
}

async function resolveSubdomain(req, res, next) {
    try {
        const { subdomain } = req.params

        if (!subdomain) {
            const error = new Error('Subdomain is required')
            error.statusCode = 400
            throw error
        }

        const projectInfo = await analyticsService.resolveSubdomain(subdomain)

        return res.json({
            status: 'success',
            data: projectInfo
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAnalytics,
    resolveSubdomain
}
