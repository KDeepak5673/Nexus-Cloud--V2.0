const logsService = require('../services/logs.service')

async function getLogs(req, res, next) {
    try {
        const { id } = req.params
        const logs = await logsService.getDeploymentLogs(id)

        return res.json({ logs })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getLogs
}
