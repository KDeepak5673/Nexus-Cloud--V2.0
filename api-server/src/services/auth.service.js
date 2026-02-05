const prisma = require('../config/database')
const { z } = require('zod')


async function registerOrUpdateUser(userData) {
    // Define validation schema
    const schema = z.object({
        firebaseUid: z.string(),
        email: z.string().email().nullable().optional(),
        displayName: z.string().nullable().optional(),
        photoURL: z.string().nullable().optional(),
        phoneNumber: z.string().nullable().optional(),
        provider: z.string()
    })

    // Validate input data
    const validatedData = schema.parse(userData)
    
    // Remove null values to avoid overwriting existing data with null
    const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== null)
    )

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { firebaseUid: cleanedData.firebaseUid }
    })

    if (existingUser) {
        // Update existing user - only update non-null fields
        return await prisma.user.update({
            where: { firebaseUid: cleanedData.firebaseUid },
            data: cleanedData
        })
    }

    // Create new user - use default values for missing fields
    return await prisma.user.create({
        data: {
            ...cleanedData,
            displayName: cleanedData.displayName || 'User',
            email: cleanedData.email || `${cleanedData.firebaseUid}@unknown.com`
        }
    })
}


async function getUserWithProjects(firebaseUid) {
    const user = await prisma.user.findUnique({
        where: { firebaseUid },
        include: {
            projects: {
                include: {
                    Deployement: {
                        orderBy: { createdAt: 'desc' },
                        take: 1  // Only latest deployment
                    }
                }
            }
        }
    })

    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    return user
}

module.exports = {
    registerOrUpdateUser,
    getUserWithProjects
}