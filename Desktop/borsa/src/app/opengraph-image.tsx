import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LyDian Trader - AI Destekli Trading Platformu';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            zIndex: 1,
          }}
        >
          {/* Logo/Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: '40px',
            }}
          >
            <span
              style={{
                fontSize: '96px',
                fontWeight: 900,
                background: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-2px',
              }}
            >
              LyDian
            </span>
            <span
              style={{
                fontSize: '64px',
                fontWeight: 600,
                color: '#94a3b8',
                marginLeft: '20px',
                letterSpacing: '4px',
              }}
            >
              TRADER
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              marginBottom: '30px',
              maxWidth: '900px',
            }}
          >
            AI Destekli Kripto & Borsa Trading Platformu
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '24px 32px',
                borderRadius: '16px',
                border: '2px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#10b981' }}>
                93%+
              </div>
              <div style={{ fontSize: '20px', color: '#94a3b8', marginTop: '8px' }}>
                Doğruluk Oranı
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(6, 182, 212, 0.1)',
                padding: '24px 32px',
                borderRadius: '16px',
                border: '2px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#06b6d4' }}>
                50+
              </div>
              <div style={{ fontSize: '20px', color: '#94a3b8', marginTop: '8px' }}>
                Canlı Coin
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(139, 92, 246, 0.1)',
                padding: '24px 32px',
                borderRadius: '16px',
                border: '2px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#8b5cf6' }}>
                AI
              </div>
              <div style={{ fontSize: '20px', color: '#94a3b8', marginTop: '8px' }}>
                Quantum Pro
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: '24px',
              color: '#64748b',
              marginTop: '50px',
              textAlign: 'center',
            }}
          >
            Gerçek Zamanlı Sinyaller • Teknik Analiz • Risk Yönetimi
          </div>
        </div>

        {/* Bottom Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(139, 92, 246, 0.2)',
            padding: '12px 24px',
            borderRadius: '999px',
            border: '2px solid rgba(139, 92, 246, 0.4)',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>
            🚀 PRO
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}