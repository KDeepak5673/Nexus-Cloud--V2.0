/**
 * PROJECT ROUTES
 * 
 * Defines all project-related endpoints
 */

const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const deploymentController = require('../controllers/deployment.controller')
const { requireAuth } = require('../middlewares/auth.middleware')

// All routes require authentication
// POST /project - Create new project
router.post('/', requireAuth, projectController.createProject)

// GET /projects - Get all user's projects
router.get('/', requireAuth, projectController.getProjects)

// GET /projects/:id - Get single project
router.get('/:id', projectController.getProjectById)

// PATCH /projects/:projectId/config - Update project configuration
router.patch('/:projectId/config', requireAuth, projectController.updateProjectConfig)

// POST /projects/:projectId/deploy - Deploy a project
router.post('/:projectId/deploy', requireAuth, deploymentController.deployProject)

module.exports = router