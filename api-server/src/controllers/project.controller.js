const projectService = require('../services/project.service')


async function createProject(req, res, next) {
    try {
        const { name, gitURL, env, rootDir, buildCommand, installCommand } = req.body
        const userId = req.user.id  // From auth middleware

        // Pass configuration to service
        const config = { env, rootDir, buildCommand, installCommand }
        const project = await projectService.createProject(name, gitURL, userId, config)

        return res.json({
            status: 'success',
            data: { project }
        })
    } catch (error) {
        next(error)
    }
}


async function getProjects(req, res, next) {
    try {
        const projects = await projectService.getUserProjects(req.user.id)

        return res.json({
            status: 'success',
            data: { projects }
        })
    } catch (error) {
        next(error)
    }
}


async function getProjectById(req, res, next) {
    try {
        const { id } = req.params
        const project = await projectService.getProjectById(id)

        return res.json({
            status: 'success',
            data: { project }
        })
    } catch (error) {
        next(error)
    }
}

async function updateProjectConfig(req, res, next) {
    try {
        const { projectId } = req.params
        const { env, rootDir, buildCommand, installCommand } = req.body
        const userId = req.user.id

        const updatedProject = await projectService.updateProjectConfig(
            projectId,
            userId,
            { env, rootDir, buildCommand, installCommand }
        )

        return res.json({
            status: 'success',
            data: { project: updatedProject }
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProjectConfig
}