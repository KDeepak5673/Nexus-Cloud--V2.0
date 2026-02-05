import { useAuth } from '../auth/AuthContext.jsx';
import { useState, useEffect, useRef } from 'react';

// Animated Metric Card Component
function AnimatedMetricCard({ icon, value, label, subtitle, delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [delay]);

    return (
        <div 
            ref={cardRef}
            className={`metric-card-animated ${isVisible ? 'visible' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="metric-icon-wrapper">
                <div className="metric-icon-glow"></div>
                <span className="metric-icon">{icon}</span>
            </div>
            <div className="metric-content">
                <div className="metric-value">{value}</div>
                <div className="metric-label">{label}</div>
                <div className="metric-subtitle">{subtitle}</div>
            </div>
        </div>
    );
}

function HomePage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetMouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        fetchAnalytics();
        initializeWaveAnimation();
    }, []);

    const initializeWaveAnimation = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId;
        let time = 0;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = 600;
        };

        const handleMouseMove = (e) => {
            targetMouseRef.current = { x: e.clientX, y: e.clientY };
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        const waves = [
            { offset: 0, amplitude: 40, frequency: 0.003, color: 'rgba(238, 124, 11, 0.3)', opacity: 0.4 },
            { offset: Math.PI / 2, amplitude: 50, frequency: 0.0025, color: 'rgba(238, 124, 11, 0.25)', opacity: 0.3 },
            { offset: Math.PI, amplitude: 35, frequency: 0.0035, color: 'rgba(18, 42, 44, 0.2)', opacity: 0.25 },
        ];

        const drawWave = (wave) => {
            ctx.save();
            ctx.beginPath();

            for (let x = 0; x <= canvas.width; x += 4) {
                const dx = x - mouseRef.current.x;
                const dy = canvas.height / 2 - mouseRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const influence = Math.max(0, 1 - distance / 300);
                const mouseEffect = influence * 30 * Math.sin(time * 0.001 + x * 0.01 + wave.offset);

                const y = canvas.height / 2 +
                    Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude +
                    Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.45) +
                    mouseEffect;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = wave.color;
            ctx.globalAlpha = wave.opacity;
            ctx.shadowBlur = 30;
            ctx.shadowColor = wave.color;
            ctx.stroke();
            ctx.restore();
        };

        const animate = () => {
            time += 1;

            mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.1;
            mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.1;

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#F9FAFB');
            gradient.addColorStop(1, '#FFFFFF');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            waves.forEach(drawWave);

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    };

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
        <div className="homepage-modern-container">
            {/* Animated Hero Section with Canvas */}
            <section className="hero-wave-section">
                <canvas ref={canvasRef} className="wave-canvas"></canvas>
                
                {/* Glassmorphism background blobs */}
                <div className="hero-background-effects">
                    <div className="bg-effect effect-1"></div>
                    <div className="bg-effect effect-2"></div>
                    <div className="bg-effect effect-3"></div>
                </div>

                <div className="hero-wave-content">
                    <div className="hero-badge">
                        <span className="badge-dot-animated"></span>
                        CLOUD DEPLOYMENT PLATFORM
                    </div>

                    <h1 className="hero-wave-title">
                        Deploy your applications
                        <span className="gradient-text"> instantly</span>
                    </h1>

                    <p className="hero-wave-subtitle">
                        Experience seamless deployment with automatic scaling, real-time monitoring,
                        and global CDN distribution. Your code, live in seconds.
                    </p>

                    <div className="hero-wave-actions">
                        <button
                            className="btn-hero-primary"
                            onClick={() => window.appState.setPage('new-project')}
                        >
                            START DEPLOYING
                            <svg className="btn-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                        <button
                            className="btn-hero-secondary"
                            onClick={() => window.appState.setPage('docs')}
                        >
                            EXPLORE DOCS
                        </button>
                    </div>

                    <div className="hero-feature-pills">
                        <span className="feature-pill">Zero Configuration</span>
                        <span className="feature-pill">Instant Deploy</span>
                        <span className="feature-pill">Auto Scaling</span>
                    </div>
                </div>
            </section>

            {/* Platform Overview Section */}
            <section className="platform-overview-section">
                <div className="container">
                    <div className="section-header-center">
                        <div className="section-badge">REAL-TIME INSIGHTS</div>
                        <h2 className="section-title-large">Platform Overview</h2>
                        <p className="section-description">
                            Live statistics and insights from our global deployment infrastructure
                        </p>
                    </div>

                    {loading ? (
                        <div className="metrics-loading">
                            <div className="loading-spinner-large"></div>
                            <p>Loading platform statistics...</p>
                        </div>
                    ) : analytics ? (
                        <div className="metrics-grid-animated">
                            <AnimatedMetricCard
                                icon="👥"
                                value={formatNumber(analytics?.totalUsers)}
                                label="Total Users"
                                subtitle="Developers using our platform"
                                delay={0}
                            />
                            <AnimatedMetricCard
                                icon="🚀"
                                value={formatNumber(analytics?.totalProjects)}
                                label="Total Projects"
                                subtitle={`${analytics?.activeProjects || 0} actively deployed`}
                                delay={100}
                            />
                            <AnimatedMetricCard
                                icon="🌐"
                                value={formatNumber(analytics?.liveProjects)}
                                label="Live Projects"
                                subtitle="Currently running deployments"
                                delay={200}
                            />
                        </div>
                    ) : (
                        <div className="metrics-error">
                            <p>Unable to load platform statistics</p>
                            <button className="btn-retry" onClick={fetchAnalytics}>
                                Retry
                            </button>
                        </div>
                    )}

                    {analytics?.lastUpdated && (
                        <div className="metrics-footer">
                            <p className="last-updated">
                                Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-modern-section">
                <div className="cta-glass-card">
                    <div className="cta-glow-effect"></div>
                    <div className="cta-content-wrapper">
                        <h2 className="cta-title">Ready to deploy your next project?</h2>
                        <p className="cta-subtitle">
                            Join thousands of developers who trust Nexus Cloud for seamless deployments
                        </p>
                        <div className="cta-actions">
                            {!user && (
                                <button
                                    className="btn-cta-primary"
                                    onClick={() => window.appState.setPage('signup')}
                                >
                                    GET STARTED FREE
                                </button>
                            )}
                            <button
                                className="btn-cta-secondary"
                                onClick={() => window.appState.setPage('docs')}
                            >
                                LEARN MORE
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;