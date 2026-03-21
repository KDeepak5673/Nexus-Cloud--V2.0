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
                            unitPriceUsd: 0.002500,
                            includedUnits: 300,
                            isDefault: true
                        },
                        {
                            metricType: 'EGRESS_MB',
                            unitPriceUsd: 0.000100,
                            includedUnits: 10240,
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
                            monthlyIncluded: 10240,
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
