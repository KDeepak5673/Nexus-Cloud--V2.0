import { useEffect, useRef } from "react";

const highlightPills = [
  
];

const heroStats = [
  { label: "One-Click Deployments"},
  { label: "Scalable Infrastructure" },
  { label: "Production-Ready Builds" },
];

export function GlowyWavesHero() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId;
    let time = 0;

    const computeThemeColors = () => {
      return {
        backgroundTop: 'rgba(249, 250, 251, 1)',
        backgroundBottom: 'rgba(249, 250, 251, 0.95)',
        wavePalette: [
          {
            offset: 0,
            amplitude: 70,
            frequency: 0.003,
            color: 'rgba(238, 124, 11, 0.8)',
            opacity: 0.45,
          },
          {
            offset: Math.PI / 2,
            amplitude: 90,
            frequency: 0.0026,
            color: 'rgba(238, 124, 11, 0.7)',
            opacity: 0.35,
          },
          {
            offset: Math.PI,
            amplitude: 60,
            frequency: 0.0034,
            color: 'rgba(18, 42, 44, 0.65)',
            opacity: 0.3,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 80,
            frequency: 0.0022,
            color: 'rgba(18, 42, 44, 0.25)',
            opacity: 0.25,
          },
          {
            offset: Math.PI * 2,
            amplitude: 55,
            frequency: 0.004,
            color: 'rgba(18, 42, 44, 0.2)',
            opacity: 0.2,
          },
        ],
      };
    };

    let themeColors = computeThemeColors();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
            wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
            (wave.amplitude * 0.45) +
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
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      className="hero-modern"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#F9FAFB'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          height: '100%',
          width: '100%'
        }}
        aria-hidden="true"
      />

      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{
            marginBottom: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '9999px',
            border: '1px solid #E5E7EB',
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#122a2c'
          }}>
            <span style={{ fontSize: '1rem' }}>✨</span>
            Deploy with confidence
          </div>

          <h1 style={{
            marginBottom: '1.5rem',
            fontSize: '4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#122a2c',
            lineHeight: 1.1
          }}>
            Welcome to{" "}
            <span style={{
              background: 'linear-gradient(to right, #ee7c0b, #d66e0a, #122a2c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Nexus Cloud
            </span>
          </h1>

          <p style={{
            margin: '0 auto 2.5rem',
            maxWidth: '48rem',
            fontSize: '1.25rem',
            color: '#6B7280',
            lineHeight: 1.6
          }}>
            Deploy your applications instantly with zero configuration.
            Experience seamless deployment with automatic scaling, real-time monitoring,
            and global CDN distribution.
          </p>

          <div style={{
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <button
              className="btn-modern btn-primary"
              onClick={() => window.appState?.setPage('new-project')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '50px',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: '#ee7c0b',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Start Deploying
              <span>→</span>
            </button>
            <button
              className="btn-modern btn-secondary"
              onClick={() => window.appState?.setPage('docs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '50px',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: '#F3F4F6',
                color: '#122a2c',
                border: '2px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              View Documentation
            </button>
          </div>

          <ul style={{
            marginBottom: '3rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#6B7280',
            listStyle: 'none',
            padding: 0
          }}>
            {highlightPills.map((pill) => (
              <li
                key={pill}
                style={{
                  borderRadius: '9999px',
                  border: '1px solid #E5E7EB',
                  background: 'rgba(255, 255, 255, 0.6)',
                  padding: '0.5rem 1rem'
                }}
              >
                {pill}
              </li>
            ))}
          </ul>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            borderRadius: '1rem',
            border: '1px solid #E5E7EB',
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '1.5rem'
          }}>
            {heroStats.map((stat) => (
              <div key={stat.label} style={{ padding: '0.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#9CA3AF',
                  marginBottom: '0.25rem'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#122a2c'
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
