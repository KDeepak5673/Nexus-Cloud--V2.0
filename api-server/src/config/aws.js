const { ECSClient } = require('@aws-sdk/client-ecs')

// Create ECS client with AWS credentials
const ecsClient = new ECSClient({
    region: process.env.AWS_REGION || 'ap-south-1',  // AWS region (Mumbai)
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,           // Your AWS Access Key
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY    // Your AWS Secret Key
    }
})

// ECS task configuration (what container to run)
const ecsConfig = {
    CLUSTER: process.env.ECS_CLUSTER,            // ECS cluster name
    TASK: process.env.ECS_TASK,                  // Task definition name
    CONTAINER_NAME: process.env.CONTAINER_NAME,  // Container name in task definition
    
    // Network configuration for Fargate
    SUBNETS: [
        process.env.SUBNET_1,
        process.env.SUBNET_2,
        process.env.SUBNET_3
    ],
    SECURITY_GROUP: process.env.SG
}

// Export both client and config
module.exports = {
    ecsClient,
    ecsConfig
}