function HeroSection() {
    return (
        <section className="hero-modern">
            <div className="hero-bg-animation">
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
            </div>
            <div className="container">
                <div className="hero-content">
                    <div className="hero-logo-section">
                        <img src="/logo.png" alt="Nexus Cloud" className="hero-logo-icon" />
                        <h1 className="hero-title">Nexus Cloud</h1>
                    </div>
                    <p className="hero-subtitle">Deploy your applications instantly with zero configuration</p>
                    <p className="hero-description">
                        Experience seamless deployment with automatic scaling, real-time monitoring,
                        and global CDN distribution. Your code, live in seconds.
                    </p>
                    <div className="hero-buttons">
                        <button
                            className="btn-modern btn-primary"
                            onClick={() => window.appState.setPage('new-project')}
                        >
                            Start Deploying
                            <span className="btn-icon">→</span>
                        </button>
                        <button
                            className="btn-modern btn-secondary"
                            onClick={() => window.appState.setPage('docs')}
                        >
                            View Documentation
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default HeroSection;