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

/**
 * Get dashboard statistics
 */
async function getDashboardStats(req, res, next) {
    try {
        const userId = req.user.id
        const stats = await analyticsService.getDashboardStats(userId)

        return res.json({
            status: 'success',
            data: stats
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get deployment activity for last 7 days
 */
async function getDeploymentActivity(req, res, next) {
    try {
        const userId = req.user.id
        const activity = await analyticsService.getDeploymentActivity(userId)

        return res.json({
            status: 'success',
            data: { last7DaysActivity: activity }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get success vs failure trend for last 7 days
 */
async function getSuccessFailureTrend(req, res, next) {
    try {
        const userId = req.user.id
        const trend = await analyticsService.getSuccessFailureTrend(userId)

        return res.json({
            status: 'success',
            data: { successFailureTrend: trend }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get recent deployments
 */
async function getRecentDeployments(req, res, next) {
    try {
        const userId = req.user.id
        const limit = req.query.limit ? parseInt(req.query.limit) : 10
        const deployments = await analyticsService.getRecentDeployments(userId, limit)

        return res.json({
            status: 'success',
            data: { recentDeployments: deployments }
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAnalytics,
    resolveSubdomain,
    getDashboardStats,
    getDeploymentActivity,
    getSuccessFailureTrend,
    getRecentDeployments
}
