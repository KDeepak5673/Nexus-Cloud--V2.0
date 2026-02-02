import StatCard from '../components/StatCard';
import DeploymentTable from '../components/DeploymentTable';
import { COLORS } from '../constants/design';

function AnalyticsPage() {
    const stats = [
        { icon: "fa-rocket", value: "142", label: "Total Deployments", trend: { direction: 'up', value: 24 } },
        { icon: "fa-check-circle", value: "128", label: "Successful", trend: { direction: 'up', value: 18 } },
        { icon: "fa-exclamation-circle", value: "14", label: "Failed", trend: { direction: 'down', value: 5 } },
        { icon: "fa-clock", value: "2", label: "Pending", trend: null }
    ];

    const deployments = [
        {
            project: "E-commerce Store",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_1a2b3c4d",
            timestamp: "10 minutes ago",
            projectId: "1"
        },
        {
            project: "Personal Blog",
            status: "prog",
            statusDisplay: "IN_PROGRESS",
            id: "dep_5e6f7g8h",
            timestamp: "25 minutes ago",
            projectId: "2"
        },
        {
            project: "Company Website",
            status: "queue",
            statusDisplay: "QUEUED",
            id: "dep_9i0j1k2l",
            timestamp: "1 hour ago",
            projectId: "3"
        },
        {
            project: "Documentation Site",
            status: "fail",
            statusDisplay: "FAIL",
            id: "dep_3m4n5o6p",
            timestamp: "2 hours ago",
            projectId: "4"
        },
        {
            project: "Marketing Site",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_7q8r9s0t",
            timestamp: "5 hours ago",
            projectId: "5"
        },
        {
            project: "API Server",
            status: "ready",
            statusDisplay: "READY",
            id: "dep_1u2v3w4x",
            timestamp: "8 hours ago",
            projectId: "6"
        }
    ];

    return (
        <div className="bg-off-white min-h-screen">
            {/* Header */}
            <section className="border-b border-beige bg-white shadow-soft">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-charcoal">Analytics & Metrics</h1>
                    <p className="text-text-muted mt-1">Monitor your deployment performance and activity</p>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            icon={`fas ${stat.icon}`}
                            value={stat.value}
                            label={stat.label}
                            trend={stat.trend}
                        />
                    ))}
                </div>
            </section>

            {/* Charts Section */}
            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Deployment Status Distribution */}
                    <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                        <h3 className="text-lg font-semibold text-charcoal mb-4">Deployment Status</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-text-secondary">Successful</span>
                                    <span className="text-sm font-semibold text-charcoal">128 (90%)</span>
                                </div>
                                <div className="w-full bg-beige rounded-full h-2">
                                    <div className="h-full rounded-full" style={{ width: '90%', background: COLORS.SAGE }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-text-secondary">Failed</span>
                                    <span className="text-sm font-semibold text-charcoal">14 (10%)</span>
                                </div>
                                <div className="w-full bg-beige rounded-full h-2">
                                    <div className="h-full rounded-full" style={{ width: '10%', background: '#a86b4f' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deployment Trends */}
                    <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                        <h3 className="text-lg font-semibold text-charcoal mb-4">Trend (This Month)</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-charcoal">↑ 24%</div>
                                <p className="text-sm text-text-muted mt-1">More deployments than last month</p>
                            </div>
                            <div className="text-5xl" style={{ color: COLORS.SAGE }}>📈</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deployment Table */}
            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-charcoal mb-2">Deployment History</h2>
                    <p className="text-text-muted">All deployment activities and logs</p>
                </div>
                <DeploymentTable deployments={deployments} />
            </section>

            {/* Time Period Filter */}
            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                    <h3 className="text-lg font-semibold text-charcoal mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 rounded-lg" style={{ background: COLORS.BEIGE }}>
                            <div className="text-2xl font-bold text-charcoal">4.2s</div>
                            <p className="text-sm text-text-secondary mt-1">Avg. Deployment Time</p>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ background: COLORS.BEIGE }}>
                            <div className="text-2xl font-bold text-charcoal">99.8%</div>
                            <p className="text-sm text-text-secondary mt-1">Success Rate</p>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ background: COLORS.BEIGE }}>
                            <div className="text-2xl font-bold text-charcoal">12ms</div>
                            <p className="text-sm text-text-secondary mt-1">Avg. Response Time</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AnalyticsPage;
