/**
 * ERROR HANDLER MIDDLEWARE
 * 
 * This catches all errors in your application and formats them consistently.
 * 
 * How it works:
 * - Any error thrown in controllers/services gets caught here
 * - Formats error into standard JSON response
 * - Logs error for debugging
 * 
 * Place this LAST in your middleware chain!
 */

/**
 * Global Error Handler
 * 
 * Express recognizes this as error handler because it has 4 parameters
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware (not used here)
 */
function errorHandler(err, req, res, next) {
    // Log error to console for debugging
    console.error('❌ Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    })

    // Determine status code
    // If error has statusCode, use it; otherwise default to 500 (Internal Server Error)
    const statusCode = err.statusCode || 500

    // Send formatted error response
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error',
        // Only show stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}

/**
 * Not Found Handler
 * 
 * Catches requests to routes that don't exist
 * Place this BEFORE errorHandler but AFTER all routes
 */
function notFoundHandler(req, res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.path}`)
    error.statusCode = 404
    next(error) // Pass to errorHandler
}

module.exports = {
    errorHandler,
    notFoundHandler
}