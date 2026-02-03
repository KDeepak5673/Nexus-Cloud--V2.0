const authService = require('../services/auth.service')

async function register(req, res, next) {
    try {
        const user = await authService.registerOrUpdateUser(req.body)
        
        return res.json({ 
            status: 'success', 
            data: { user } 
        })
    } catch (error) {
        next(error)
    }
}

async function getUser(req, res, next) {
    try {
        const { firebaseUid } = req.params
        const user = await authService.getUserWithProjects(firebaseUid)
        
        return res.json({ 
            status: 'success', 
            data: { user } 
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    register,
    getUser
}