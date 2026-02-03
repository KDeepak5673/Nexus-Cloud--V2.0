/**
 * PROJECT ROUTES
 * 
 * Defines all project-related endpoints
 */

const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const { requireAuth } = require('../middlewares/auth.middleware')

// All routes require authentication
// POST /project - Create new project
router.post('/', requireAuth, projectController.createProject)

// GET /projects - Get all user's projects
router.get('/', requireAuth, projectController.getProjects)

// GET /projects/:id - Get single project
router.get('/:id', projectController.getProjectById)

module.exports = router