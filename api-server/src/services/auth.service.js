const prisma = require('../config/database')
const { z } = require('zod')


async function registerOrUpdateUser(userData) {
    // Define validation schema
    const schema = z.object({
        firebaseUid: z.string(),
        email: z.string().email(),
        displayName: z.string().optional(),
        photoURL: z.string().optional(),
        provider: z.string()
    })

    // Validate input data
    const validatedData = schema.parse(userData)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { firebaseUid: validatedData.firebaseUid }
    })

    if (existingUser) {
        // Update existing user
        return await prisma.user.update({
            where: { firebaseUid: validatedData.firebaseUid },
            data: validatedData
        })
    }

    // Create new user
    return await prisma.user.create({
        data: validatedData
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