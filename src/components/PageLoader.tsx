import React, { useEffect, useState } from 'react';

interface PageLoaderProps {
  isVisible: boolean;
}

export default function PageLoader({ isVisible }: PageLoaderProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => setHidden(true), 600);
      return () => clearTimeout(timer);
    } else {
      setHidden(false);
    }
  }, [isVisible]);

  if (hidden) return null;

  return (
    <div
      id="paynode-page-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #0A2540 100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: isVisible ? 'all' : 'none',
      }}
    >
      {/* Radial glow background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Animated rings */}
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 32 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(0,229,255,0.15)',
          borderRadius: '50%',
          animation: 'pn-ring-pulse 2s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 12,
          border: '2px solid rgba(0,229,255,0.3)',
          borderTopColor: '#00E5FF',
          borderRadius: '50%',
          animation: 'pn-spin 1.2s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 24,
          border: '2px solid rgba(0,229,255,0.2)',
          borderBottomColor: '#32CD32',
          borderRadius: '50%',
          animation: 'pn-spin-reverse 0.8s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 36,
          background: 'linear-gradient(135deg, #00E5FF, #0A7F9A)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pn-glow-pulse 1.5s ease-in-out infinite alternate',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          fontSize: 22,
          fontWeight: 900,
          color: 'white',
          letterSpacing: '0.08em',
          fontFamily: '"Poppins", "Cairo", sans-serif',
          marginBottom: 4,
        }}>
          PAY<span style={{ color: '#00E5FF' }}>NODE</span>
        </div>
        <div style={{
          fontSize: 10,
          color: 'rgba(0,229,255,0.6)',
          letterSpacing: '0.25em',
          fontFamily: '"Poppins", monospace',
          textTransform: 'uppercase',
        }}>
          جاري تحميل المتجر...
        </div>
      </div>

      <div style={{
        width: 180,
        height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #00E5FF, #32CD32)',
          borderRadius: 99,
          animation: 'pn-progress 1.8s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes pn-spin { to { transform: rotate(360deg); } }
        @keyframes pn-spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes pn-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.1; }
        }
        @keyframes pn-glow-pulse {
          from { box-shadow: 0 0 8px rgba(0,229,255,0.4); }
          to { box-shadow: 0 0 20px rgba(0,229,255,0.9), 0 0 40px rgba(0,229,255,0.3); }
        }
        @keyframes pn-progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
