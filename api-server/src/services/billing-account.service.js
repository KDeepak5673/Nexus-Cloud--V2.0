const prisma = require('../config/database')

async function ensureBillingAccountForUser(user) {
    const existingMembership = await prisma.billingAccountMember.findFirst({
        where: { userId: user.id },
        include: { billingAccount: true }
    })

    if (existingMembership?.billingAccount) {
        return existingMembership.billingAccount
    }

    const billingAccount = await prisma.billingAccount.create({
        data: {
            name: user.displayName ? `${user.displayName} Workspace` : `${user.email || 'Nexus'} Workspace`,
            currency: 'INR',
            createdByUserId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: 'OWNER'
                }
            },
            pricingRules: {
                createMany: {
                    data: [
                        {
                            metricType: 'BUILD_MINUTES',
                            unitPriceInr: 0.2075,
                            includedUnits: 300,
                            isDefault: true
                        },
                        {
                            metricType: 'EGRESS_MB',
                            unitPriceInr: 0.0083,
                            includedUnits: 1024,
                            isDefault: true
                        },
                        {
                            metricType: 'DEPLOYMENT_COUNT',
                            unitPriceInr: 8.3,
                            includedUnits: 10,
                            isDefault: true
                        },
                        {
                            metricType: 'PROJECT_COUNT',
                            unitPriceInr: 166.0,
                            includedUnits: 5,
                            isDefault: true
                        }
                    ]
                }
            },
            quotaPolicies: {
                createMany: {
                    data: [
                        {
                            metricType: 'BUILD_MINUTES',
                            monthlyIncluded: 300,
                            softLimitPercent: 80,
                            hardLimitPercent: 100,
                            enforcement: 'SOFT'
                        },
                        {
                            metricType: 'EGRESS_MB',
                            monthlyIncluded: 1024,
                            softLimitPercent: 80,
                            hardLimitPercent: 100,
                            enforcement: 'SOFT'
                        }
                    ]
                }
            }
        }
    })

    return billingAccount
}

async function getPrimaryBillingAccountForUser(userId) {
    const membership = await prisma.billingAccountMember.findFirst({
        where: { userId },
        include: { billingAccount: true }
    })

    if (!membership?.billingAccount) {
        const err = new Error('Billing account not found for user')
        err.statusCode = 404
        throw err
    }

    return membership.billingAccount
}

async function getBillingRole(userId, accountId) {
    const membership = await prisma.billingAccountMember.findUnique({
        where: {
            billingAccountId_userId: {
                billingAccountId: accountId,
                userId
            }
        }
    })

    return membership?.role || null
}

module.exports = {
    ensureBillingAccountForUser,
    getPrimaryBillingAccountForUser,
    getBillingRole
}
