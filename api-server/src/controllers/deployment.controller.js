const deploymentService = require('../services/deployment.service')

async function createDeployment(req, res, next) {
    try {
        const { projectId } = req.body
        const mode = req.body?.mode || 'latest'
        const userId = req.user.id

        const deployment = await deploymentService.createDeployment(projectId, userId, { mode })

        return res.json({
            status: 'queued',
            data: { deploymentId: deployment.id }
        })
    } catch (error) {
        next(error)
    }
}

async function deployProject(req, res, next) {
    try {
        const { projectId } = req.params
        const mode = req.body?.mode || 'latest'
        const userId = req.user.id

        const deployment = await deploymentService.createDeployment(projectId, userId, { mode })

        return res.json({
            message: 'Deployment started',
            deploymentId: deployment.id,
            status: deployment.status,
            mode
        })
    } catch (error) {
        next(error)
    }
}

async function getDeploymentStatus(req, res, next) {
    try {
        const { deploymentId } = req.params
        const userId = req.user.id

        const deployment = await deploymentService.getDeploymentStatus(deploymentId, userId)

        return res.json({
            id: deployment.id,
            status: deployment.status,
            createdAt: deployment.createdAt,
            projectId: deployment.projectId,
            projectName: deployment.project.name
        })
    } catch (error) {
        next(error)
    }
}

async function getDeploymentUrl(req, res, next) {
    try {
        const { deploymentId } = req.params
        const userId = req.user.id

        const deploymentInfo = await deploymentService.getDeploymentUrl(deploymentId, userId)

        return res.json(deploymentInfo)
    } catch (error) {
        next(error)
    }
}

async function getAllDeployments(req, res, next) {
    try {
        const userId = req.user.id
        const deployments = await deploymentService.getUserDeployments(userId)

        return res.json({
            status: 'success',
            data: { deployments }
        })
    } catch (error) {
        next(error)
    }
}

async function updateDeploymentStatus(req, res, next) {
    try {
        const { id } = req.params
        const { status } = req.body

        const deployment = await deploymentService.updateDeploymentStatus(id, status)

        return res.json({
            status: 'success',
            data: { deployment }
        })
    } catch (error) {
        next(error)
    }
}

async function simulateDeployment(req, res, next) {
    try {
        const { id } = req.params

        await deploymentService.simulateDeploymentProcess(id)

        return res.json({
            status: 'success',
            message: 'Deployment simulation started'
        })
    } catch (error) {
        next(error)
    }
}

async function deleteDeployment(req, res, next) {
    try {
        const { deploymentId } = req.params
        const userId = req.user.id

        await deploymentService.deleteDeployment(deploymentId, userId)

        return res.json({
            success: true,
            message: 'Deployment deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createDeployment,
    deployProject,
    getDeploymentStatus,
    getDeploymentUrl,
    getAllDeployments,
    updateDeploymentStatus,
    simulateDeployment,
    deleteDeployment
}
