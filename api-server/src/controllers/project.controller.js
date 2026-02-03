const projectService = require('../services/project.service')


async function createProject(req, res, next) {
    try {
        const { name, gitURL } = req.body
        const userId = req.user.id  // From auth middleware

        const project = await projectService.createProject(name, gitURL, userId)
        
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

module.exports = {
    createProject,
    getProjects,
    getProjectById
}