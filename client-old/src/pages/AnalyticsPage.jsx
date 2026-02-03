import StatCard from '../components/StatCard';
import DeploymentTable from '../components/DeploymentTable';

function AnalyticsPage() {
    const stats = [
        { icon: "fas fa-rocket", value: "142", label: "Total Deployments" },
        { icon: "fas fa-check-circle", value: "128", label: "Successful Deployments" },
        { icon: "fas fa-exclamation-circle", value: "14", label: "Failed Deployments" },
        { icon: "fas fa-clock", value: "2", label: "Pending Deployments" }
    ];

    const deployments = [
        {
            project: "E-commerce Store",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_1a2b3c4d",
            timestamp: "10 minutes ago"
        },
        {
            project: "Personal Blog",
            status: "prog",
            statusDisplay: "PROGRESS",
            id: "dep_5e6f7g8h",
            timestamp: "25 minutes ago"
        },
        {
            project: "Company Website",
            status: "queue",
            statusDisplay: "QUEUED",
            id: "dep_9i0j1k2l",
            timestamp: "1 hour ago"
        },
        {
            project: "Documentation Site",
            status: "fail",
            statusDisplay: "FAILED",
            id: "dep_3m4n5o6p",
            timestamp: "2 hours ago"
        },
        {
            project: "Marketing Site",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_7q8r9s0t",
            timestamp: "5 hours ago"
        },
        {
            project: "API Server",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_2u3v4w5x",
            timestamp: "1 day ago"
        }
    ];

    return (
        <section className="analytics-preview">
            <div className="container">
                <div className="section-header">
                    <h2>Deployment Analytics</h2>
                    <p>Monitor your deployment status and track performance metrics.</p>
                </div>
                
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>
                
                <h3 style={{marginTop: "60px"}}>Deployment History</h3>
                <DeploymentTable deployments={deployments} />
            </div>
        </section>
    );
}

export default AnalyticsPage;