/**
 * PROJECT CONTROLLERS
 * 
 * Handle HTTP requests for project endpoints
 */

const projectService = require('../services/project.service')

/**
 * POST /project
 * Create a new project
 */
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

/**
 * GET /projects
 * Get all projects for authenticated user
 */
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

/**
 * GET /projects/:id
 * Get single project by ID
 */
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