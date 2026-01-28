import HeroSection from '../components/HeroSection';
import { useAuth } from '../auth/AuthContext.jsx';
import { useState, useEffect } from 'react';

function HomePage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('http://localhost:9000/api/analytics');
            const data = await response.json();

            if (data.status === 'success') {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        // Handle undefined, null, or non-numeric values
        if (num === undefined || num === null || isNaN(num)) {
            return '0';
        }

        const numValue = Number(num);
        if (numValue >= 1000000) {
            return (numValue / 1000000).toFixed(1) + 'M';
        } else if (numValue >= 1000) {
            return (numValue / 1000).toFixed(1) + 'K';
        }
        return numValue.toString();
    };

    return (
        <>
            <HeroSection />

            <section className="analytics-section">
                <div className="container">
                    <div className="analytics-header">
                        <div className="analytics-title">
                            <h2>Platform Overview</h2>
                            <p>Real-time statistics and insights from our deployment platform</p>
                        </div>
                        <button
                            className="refresh-analytics-btn"
                            onClick={fetchAnalytics}
                            disabled={loading}
                            title="Refresh statistics"
                        >
                            🔄 Refresh
                        </button>
                    </div>                    {loading ? (
                        <div className="analytics-loading">
                            <div className="spinner"></div>
                            <p>Loading platform statistics...</p>
                        </div>
                    ) : analytics ? (
                        <div className="analytics-grid">
                            <div className="analytics-card primary">
                                <div className="analytics-icon">👥</div>
                                <div className="analytics-content">
                                    <h3>{formatNumber(analytics?.totalUsers)}</h3>
                                    <p>Total Users</p>
                                    <span className="analytics-subtitle">Developers using our platform</span>
                                </div>
                            </div>

                            <div className="analytics-card success">
                                <div className="analytics-icon">🚀</div>
                                <div className="analytics-content">
                                    <h3>{formatNumber(analytics?.totalProjects)}</h3>
                                    <p>Total Projects</p>
                                    <span className="analytics-subtitle">{analytics?.activeProjects || 0} actively deployed</span>
                                </div>
                            </div>

                            <div className="analytics-card live">
                                <div className="analytics-icon">🌐</div>
                                <div className="analytics-content">
                                    <h3>{formatNumber(analytics?.liveProjects)}</h3>
                                    <p>Live Projects</p>
                                    <span className="analytics-subtitle">Currently running deployments</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="analytics-error">
                            <p>Unable to load platform statistics at this time.</p>
                        </div>
                    )}

                    <div className="analytics-footer">
                        <p className="analytics-updated">
                            {analytics?.lastUpdated && `Last updated: ${new Date(analytics.lastUpdated).toLocaleString()}`}
                        </p>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to deploy your next project?</h2>
                        <p>Join thousands of developers who trust Nexus Cloud for their deployments</p>
                        <div className="cta-buttons">
                            {!user && (
                                <button
                                    className="btn-modern btn-primary"
                                    onClick={() => window.appState.setPage('signup')}
                                >
                                    Get Started Free
                                </button>
                            )}
                            <button
                                className="btn-modern btn-outline"
                                onClick={() => window.appState.setPage('docs')}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;