const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    log: ['warn', 'error'], // Only log warnings and errors (not every query)
})

module.exports = prisma
