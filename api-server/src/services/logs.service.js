const clickhouse = require('../config/clickhouse')

async function getDeploymentLogs(deploymentId) {
    const logs = await clickhouse.query({
        query: `SELECT event_id, deployment_id, log, timestamp FROM log_events WHERE deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: deploymentId
        },
        format: 'JSONEachRow'
    })

    const rawLogs = await logs.json()
    return rawLogs
}

module.exports = {
    getDeploymentLogs
}
