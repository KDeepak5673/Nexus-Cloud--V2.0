import HeroSection from '../components/HeroSection';
import { useAuth } from '../auth/AuthContext.jsx';
import { useState, useEffect } from 'react';
import { COLORS } from '../constants/design';
import { Users, Zap, Package, Gauge, Bolt, Lock, BarChart3, Globe, Cpu, Wrench, RefreshCw } from 'lucide-react';

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
        if (num === undefined || num === null || isNaN(num)) return '0';
        const numValue = Number(num);
        if (numValue >= 1000000) return (numValue / 1000000).toFixed(1) + 'M';
        if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'K';
        return numValue.toString();
    };

    return (
        <>
            <HeroSection />

            {/* Platform Overview Section */}
            <section style={{ background: COLORS.LIGHT_BG, padding: '4rem 1.5rem' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold" style={{ color: COLORS.DARK_PRIMARY }}>Platform Overview</h2>
                            <p style={{ color: COLORS.TEXT_SECONDARY_LIGHT, marginTop: '0.5rem' }}>Real-time statistics from our deployment infrastructure</p>
                        </div>
                        <button
                            className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
                            onClick={fetchAnalytics}
                            disabled={loading}
                            style={{ background: COLORS.ACCENT, color: COLORS.DARK_PRIMARY, border: 'none', cursor: 'pointer' }}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="w-10 h-10 rounded-full animate-spin border-4 mx-auto" style={{ borderColor: COLORS.ACCENT, borderTopColor: 'transparent' }}></div>
                            <p style={{ color: COLORS.TEXT_MUTED_LIGHT, marginTop: '1rem' }}>Loading statistics...</p>
                        </div>
                    ) : analytics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: Users, label: 'Total Users', value: analytics?.totalUsers },
                                { icon: Zap, label: 'Total Projects', value: analytics?.totalProjects },
                                { icon: Package, label: 'Total Deployments', value: analytics?.totalDeployments },
                                { icon: Gauge, label: 'Platform Uptime', value: '99.9%' }
                            ].map((card, idx) => {
                                const IconComponent = card.icon;
                                return (
                                    <div key={idx} className="rounded-lg p-6" style={{ background: 'rgba(78,65,59,0.03)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <IconComponent size={24} color={COLORS.ACCENT} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-2xl font-semibold" style={{ color: COLORS.DARK_PRIMARY, margin: 0 }}>{formatNumber(card.value)}</h3>
                                        <p style={{ color: COLORS.TEXT_MUTED_LIGHT, fontSize: '0.875rem', marginTop: '0.25rem' }}>{card.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg p-12 text-center" style={{ background: 'rgba(78,65,59,0.03)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <p style={{ color: COLORS.TEXT_MUTED_LIGHT }}>Unable to load statistics</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section style={{ background: 'white', padding: '4rem 1.5rem' }}>
                <div className="max-w-7xl mx-auto">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.DARK_PRIMARY }}>Why Choose Nexus Cloud?</h2>
                        <p style={{ color: COLORS.TEXT_SECONDARY_LIGHT }}>Everything you need to deploy and manage applications</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Bolt, title: 'Lightning Fast', desc: 'Deploy in seconds with optimized infrastructure' },
                            { icon: Lock, title: 'Secure by Default', desc: 'Enterprise-grade security for applications' },
                            { icon: BarChart3, title: 'Real-time Monitoring', desc: 'Track deployments with detailed analytics' },
                            { icon: Globe, title: 'Global CDN', desc: 'Distribute your apps globally with ease' },
                            { icon: Cpu, title: 'Auto-scaling', desc: 'Automatically scale based on demand' },
                            { icon: Wrench, title: 'Easy Integration', desc: 'Simple API and CLI integration' }
                        ].map((feature, idx) => {
                            const IconComponent = feature.icon;
                            return (
                                <div key={idx} className="p-6 rounded-lg hover:shadow-md transition-shadow" style={{ background: 'rgba(78,65,59,0.02)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <IconComponent size={28} color={COLORS.ACCENT} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.DARK_PRIMARY }}>{feature.title}</h3>
                                    <p style={{ color: COLORS.TEXT_MUTED_LIGHT, fontSize: '0.875rem' }}>{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ background: COLORS.LIGHT_BG, padding: '4rem 1.5rem' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.DARK_PRIMARY }}>Ready to Get Started?</h2>
                    <p style={{ color: COLORS.TEXT_SECONDARY_LIGHT, fontSize: '1.125rem', marginBottom: '2rem' }}>Join thousands of developers deploying on Nexus Cloud</p>
                    <button
                        className="px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                        style={{ background: COLORS.ACCENT, color: COLORS.DARK_PRIMARY, border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        onClick={() => user ? window.appState.setPage('dashboard') : window.appState.setPage('signup')}
                    >
                        {user ? 'Go to Dashboard' : 'Sign Up Now'} →
                    </button>
                </div>
            </section>
        </>
    );
}

export default HomePage;
