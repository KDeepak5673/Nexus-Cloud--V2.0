// Success response helper
function successResponse(res, data, message = 'Success') {
    return res.json({
        status: 'success',
        message,
        data
    })
}

// Error response helper
function errorResponse(res, error, statusCode = 500) {
    return res.status(statusCode).json({
        status: 'error',
        error: error.message || error
    })
}

module.exports = { successResponse, errorResponse }