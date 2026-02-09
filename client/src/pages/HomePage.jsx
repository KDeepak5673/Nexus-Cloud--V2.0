import { GlowyWavesHero } from '../components/GlowyWavesHero';
import { useAuth } from '../auth/AuthContext.jsx';
import { useState, useEffect } from 'react';
import { getAnalytics } from '../lib/api';

function HomePage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await getAnalytics();

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
            <GlowyWavesHero />

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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                    <div className="analytics-grid">
                        <div className="analytics-card primary">
                            <div className="analytics-icon-svg">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="analytics-content">
                                <h3>{loading ? '...' : formatNumber(analytics?.totalUsers)}</h3>
                                <p>Total Users</p>
                                <span className="analytics-subtitle">Developers using our platform</span>
                            </div>
                        </div>
                        <div className="analytics-card success">
                            <div className="analytics-icon-svg">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <div className="analytics-content">
                                <h3>{loading ? '...' : formatNumber(analytics?.totalProjects)}</h3>
                                <p>Total Projects</p>
                                <span className="analytics-subtitle">{analytics?.activeProjects || 0} actively deployed</span>
                            </div>
                        </div>
                        <div className="analytics-card live">
                            <div className="analytics-icon-svg">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                            </div>
                            <div className="analytics-content">
                                <h3>{loading ? '...' : formatNumber(analytics?.liveProjects)}</h3>
                                <p>Live Projects</p>
                                <span className="analytics-subtitle">Currently running deployments</span>
                            </div>
                        </div>
                    </div>
                    <div className="analytics-footer">
                        <p className="analytics-updated">
                            {analytics?.lastUpdated && `Last updated: ${new Date(analytics.lastUpdated).toLocaleString()}`}
                        </p>
                    </div>
                </div>
            </section>

            {/* <section className="cta-section"> */}
                {/* <div className="container">
                    <div className="cta-content"> */}
                        {/* <h2>Ready to deploy your next project?</h2>
                        <p>Join thousands of developers who trust Nexus Cloud for their deployments</p> */}
                        {/* <div className="cta-buttons">
                            {!user && (
                                <button
                                    className="btn-modern btn-primary"
                                    style={{ background: '#ee7c0b', color: '#fff', borderRadius: '50px', fontWeight: 600 }}
                                    onClick={() => window.appState.setPage('signup')}
                                >
                                    Get Started Free
                                </button>
                            )}
                            <button
                                className="btn-modern btn-outline"
                                style={{ border: '2px solid #122a2c', color: '#122a2c', borderRadius: '50px', fontWeight: 600 }}
                                onClick={() => window.appState.setPage('docs')}
                            >
                                Learn More
                            </button>
                        </div> */}
                    {/* </div>
                </div> */}
            {/* </section> */}
        </>
    );
}

export default HomePage;