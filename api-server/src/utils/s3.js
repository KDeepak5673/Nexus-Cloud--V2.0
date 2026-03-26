const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

// Create S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'nexus-cloud-v2.0'

/**
 * Delete a deployment's artifacts from S3
 * This removes all files under the deployment prefix
 * 
 * @param {string} deploymentId - The deployment ID
 * @param {string} subDomain - The project's subdomain (legacy fallback)
 * @param {string} projectId - The project ID (preferred for __outputs prefix)
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteDeploymentFromS3(deploymentId, subDomain, projectId) {
    try {
        console.log(`🗑️ Starting S3 cleanup for deployment: ${deploymentId}`)

        const prefixes = [
            projectId ? `__outputs/${projectId}/` : null,
            projectId ? `${projectId}/` : null,
            subDomain ? `${subDomain}/` : null
        ].filter(Boolean)

        let deletedObjects = 0

        for (const prefix of prefixes) {
            const listCommand = new ListObjectsV2Command({
                Bucket: S3_BUCKET,
                Prefix: prefix
            })

            const listResponse = await s3Client.send(listCommand)

            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                continue
            }

            const deletePromises = listResponse.Contents.map(object => {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: object.Key
                })
                return s3Client.send(deleteCommand)
            })

            await Promise.all(deletePromises)
            deletedObjects += listResponse.Contents.length
        }

        if (deletedObjects === 0) {
            console.log(`ℹ️ No files found in S3 for deployment cleanup. projectId=${projectId || 'n/a'} subDomain=${subDomain || 'n/a'}`)
            return true
        }

        console.log(`✅ Successfully deleted ${deletedObjects} files from S3 for deployment: ${deploymentId}`)
        return true
    } catch (error) {
        console.error(`❌ Error deleting deployment from S3: ${error.message}`)
        // Don't throw error - allow deletion to continue even if S3 cleanup fails
        // This prevents data inconsistency if S3 is temporarily unavailable
        return false
    }
}

/**
 * Delete a specific object from S3
 * 
 * @param {string} key - The S3 object key
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteObjectFromS3(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key
        })

        await s3Client.send(command)
        console.log(`✅ Deleted S3 object: ${key}`)
        return true
    } catch (error) {
        console.error(`❌ Error deleting S3 object ${key}: ${error.message}`)
        return false
    }
}

module.exports = {
    deleteDeploymentFromS3,
    deleteObjectFromS3,
    s3Client,
    S3_BUCKET
}
