const { consumer } = require('../config/kafka')
const clickhouse = require('../config/clickhouse')
const { v4: uuidv4 } = require('uuid')
const prisma = require('../config/database')

async function initKafkaConsumer() {
    try {
        console.log('🔄 Attempting to connect to Kafka...')
        await consumer.connect()
        await consumer.subscribe({ topics: ['container-logs'], fromBeginning: true })
        console.log('✅ Kafka connected and subscribed successfully')

        await consumer.run({
            eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
                const messages = batch.messages
                console.log(`📨 Recv. ${messages.length} messages..`)

                for (const message of messages) {
                    if (!message.value) continue

                    try {
                        const stringMessage = message.value.toString()
                        const { PROJECT_ID, DEPLOYEMENT_ID, log } = JSON.parse(stringMessage)
                        console.log({ log, DEPLOYEMENT_ID })

                        // Insert into ClickHouse
                        const { query_id } = await clickhouse.insert({
                            table: 'log_events',
                            values: [{
                                event_id: uuidv4(),
                                deployment_id: DEPLOYEMENT_ID,
                                log
                            }],
                            format: 'JSONEachRow'
                        })
                        console.log(`✅ Inserted log: ${query_id}`)

                        // Check if deployment is complete based on log message
                        if (log.includes('Done') && !log.includes('Error') && !log.includes('Failed')) {
                            console.log(`🎉 Deployment ${DEPLOYEMENT_ID} completed! Updating status to READY...`)
                            
                            try {
                                await prisma.deployement.update({
                                    where: { id: DEPLOYEMENT_ID },
                                    data: { status: 'READY' }
                                })
                                
                                const deployment = await prisma.deployement.findUnique({
                                    where: { id: DEPLOYEMENT_ID },
                                    include: { project: true }
                                })
                                
                                if (deployment && deployment.project) {
                                    const deploymentUrl = `http://${deployment.project.subDomain}.localhost:8000`
                                    console.log(`✅ Deployment ${DEPLOYEMENT_ID} is now READY`)
                                    console.log(`🌐 Deployment URL: ${deploymentUrl}`)
                                    
                                    // Emit deployment complete event
                                    if (global.io) {
                                        global.io.to(`deployment:${DEPLOYEMENT_ID}`).emit('deployment-complete', {
                                            deploymentId: DEPLOYEMENT_ID,
                                            status: 'READY',
                                            url: deploymentUrl
                                        })
                                    }
                                }
                            } catch (dbError) {
                                console.error('❌ Error updating deployment status:', dbError)
                            }
                        }
                        
                        // Check for build errors/failures
                        if (log.includes('Error:') || log.includes('FAILED') || log.includes('Build failed')) {
                            console.log(`❌ Deployment ${DEPLOYEMENT_ID} failed! Updating status to FAIL...`)
                            
                            try {
                                await prisma.deployement.update({
                                    where: { id: DEPLOYEMENT_ID },
                                    data: { status: 'FAIL' }
                                })
                                console.log(`❌ Deployment ${DEPLOYEMENT_ID} marked as FAILED`)
                                
                                // Emit deployment failed event
                                if (global.io) {
                                    global.io.to(`deployment:${DEPLOYEMENT_ID}`).emit('deployment-failed', {
                                        deploymentId: DEPLOYEMENT_ID,
                                        status: 'FAIL'
                                    })
                                }
                            } catch (dbError) {
                                console.error('❌ Error updating deployment status:', dbError)
                            }
                        }

                        // Emit to Socket.IO clients subscribed to this deployment
                        if (global.io) {
                            global.io.to(`deployment:${DEPLOYEMENT_ID}`).emit('logs', {
                                deploymentId: DEPLOYEMENT_ID,
                                log: log,
                                timestamp: new Date().toISOString()
                            })
                            console.log(`📤 Log emitted to deployment:${DEPLOYEMENT_ID}`)
                        }

                        resolveOffset(message.offset)
                        await commitOffsetsIfNecessary(message.offset)
                        await heartbeat()
                    } catch (err) {
                        console.error('❌ Error processing message:', err)
                    }
                }
            }
        })
    } catch (error) {
        console.error('❌ Kafka connection failed:', error.message)
        console.log('⏳ Server will continue without Kafka. Retrying in 30 seconds...')
        setTimeout(() => {
            initKafkaConsumer().catch(err => {
                console.error('Kafka retry failed:', err.message)
            })
        }, 30000)
    }
}

async function disconnectKafka() {
    try {
        await consumer.disconnect()
        console.log('Kafka consumer disconnected')
    } catch (error) {
        console.error('Error disconnecting Kafka:', error)
    }
}

module.exports = {
    initKafkaConsumer,
    disconnectKafka
}
