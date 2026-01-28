import { COLORS } from '../constants/design'

function HeroSection() {
    return (
        <section style={{ background: COLORS.LIGHT_BG, padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background decoration (subtle) */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', width: '20rem', height: '20rem', borderRadius: '50%', background: `rgba(255,109,36,0.05)` }}></div>
                <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', width: '20rem', height: '20rem', borderRadius: '50%', background: `rgba(78,65,59,0.05)` }}></div>
            </div>

            <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                {/* Logo Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', paddingX: '1rem', paddingY: '0.5rem', borderRadius: '9999px', border: `1px solid ${COLORS.MUTED}33`, marginBottom: '2rem' }}>
                    <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', background: COLORS.ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: COLORS.DARK_PRIMARY, fontSize: '0.75rem', fontWeight: 'bold' }}>N</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: COLORS.TEXT_SECONDARY_LIGHT }}>Nexus Cloud</span>
                </div>

                {/* Main heading */}
                <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', color: COLORS.DARK_PRIMARY, marginBottom: '1.5rem', lineHeight: '1.2' }}>
                    Deploy your applications
                    <br />
                    <span style={{ color: COLORS.ACCENT }}>instantly with zero configuration</span>
                </h1>

                {/* Subheading */}
                <p style={{ fontSize: '1.125rem', color: COLORS.TEXT_SECONDARY_LIGHT, maxWidth: '40rem', margin: '0 auto 1rem' }}>
                    Experience seamless deployment with automatic scaling, real-time monitoring, and global CDN distribution.
                </p>
                <p style={{ fontSize: '1rem', color: COLORS.TEXT_MUTED_LIGHT, margin: '0 auto 2.5rem' }}>
                    Your code, live in seconds.
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
                    <button
                        className="sm:flex-row"
                        style={{ 
                            padding: '0.75rem 2rem', 
                            borderRadius: '0.5rem', 
                            color: COLORS.DARK_PRIMARY, 
                            fontWeight: '600', 
                            fontSize: '1rem',
                            border: 'none',
                            background: COLORS.ACCENT,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                        onClick={() => window.appState.setPage('new-project')}
                    >
                        Start Deploying →
                    </button>
                    <button
                        style={{ 
                            padding: '0.75rem 2rem', 
                            borderRadius: '0.5rem', 
                            fontWeight: '600', 
                            fontSize: '1rem',
                            border: `2px solid ${COLORS.ACCENT}`,
                            background: 'transparent',
                            color: COLORS.ACCENT,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = COLORS.ACCENT; e.target.style.color = COLORS.DARK_PRIMARY; }}
                        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = COLORS.ACCENT; }}
                        onClick={() => window.appState.setPage('docs')}
                    >
                        View Docs
                    </button>
                </div>

                {/* Social proof */}
                <div style={{ paddingTop: '4rem', borderTop: `1px solid ${COLORS.MUTED}33` }}>
                    <p style={{ fontSize: '0.875rem', color: COLORS.TEXT_MUTED_LIGHT, marginBottom: '1.5rem' }}>Trusted by developers worldwide</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', textAlign: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.DARK_PRIMARY }}>10K+</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_MUTED_LIGHT }}>Deployments</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.DARK_PRIMARY }}>99.9%</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_MUTED_LIGHT }}>Uptime</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.DARK_PRIMARY }}>5K+</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_MUTED_LIGHT }}>Users</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;