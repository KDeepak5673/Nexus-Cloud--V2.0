/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * These middlewares check if a user is logged in before allowing access to routes.
 * 
 * How middleware works:
 * Request → Middleware (check auth) → Controller (handle request) → Response
 *           ↓
 *      If not authenticated, return 401 error
 *      If authenticated, continue to controller
 */

const prisma = require('../config/database')

/**
 * Require Authentication - Check x-firebase-uid header
 * 
 * Used for routes that need a logged-in user
 * Usage: router.get('/projects', requireAuth, controller.getProjects)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Call this to continue to next middleware/controller
 */
async function requireAuth(req, res, next) {
    try {
        // 1. Get Firebase UID from request header
        const firebaseUid = req.headers['x-firebase-uid']
        
        // 2. Check if header exists
        if (!firebaseUid) {
            return res.status(401).json({ 
                error: 'Authentication required' 
            })
        }

        // 3. Find user in database
        const user = await prisma.user.findUnique({
            where: { firebaseUid }
        })

        // 4. Check if user exists
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found' 
            })
        }

        // 5. Attach user to request so controllers can access it
        // Now any controller can use: req.user.id, req.user.email, etc.
        req.user = user
        
        // 6. Continue to next middleware or controller
        next()
        
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({ 
            error: 'Authentication failed' 
        })
    }
}

/**
 * Verify Bearer Token - Check Authorization header
 * 
 * Alternative authentication method using Bearer token
 * Usage: router.get('/api/deployments', verifyAuth, controller.getDeployments)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Call this to continue
 */
async function verifyAuth(req, res, next) {
    try {
        // 1. Get Authorization header (format: "Bearer TOKEN")
        const authHeader = req.headers.authorization
        
        // 2. Check if header exists and starts with "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Authorization token required' 
            })
        }

        // 3. Extract token (remove "Bearer " prefix)
        const token = authHeader.substring(7)

        // 4. Get Firebase UID from header (simplified - in production, verify the token)
        // TODO: Add Firebase Admin SDK to verify token properly
        const firebaseUid = req.headers['x-firebase-uid'] || 'mock-uid'

        // 5. Find user in database
        const user = await prisma.user.findUnique({
            where: { firebaseUid }
        })

        // 6. Check if user exists
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found' 
            })
        }

        // 7. Attach user to request
        req.user = user
        
        // 8. Continue to controller
        next()
        
    } catch (error) {
        console.error('Auth verification error:', error)
        return res.status(500).json({ 
            error: 'Authentication failed' 
        })
    }
}

// Export both middleware functions
module.exports = {
    requireAuth,
    verifyAuth
}