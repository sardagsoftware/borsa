'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function SearchPage() {
  const isNeonNoir = process.env.NEXT_PUBLIC_NEON_NOIR_THEME === '1'

  return (
    <>
      <TopNav />
      <div className={`min-h-screen pt-16 ${isNeonNoir ? 'theme-neon-noir' : ''}`}>
        <div
          className="min-h-screen font-sans antialiased"
          style={{
            fontFamily: "'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            background: isNeonNoir ? 'var(--bg-0)' : '#212121',
            color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
            margin: 0,
            overflowX: 'hidden'
          }}
        >
          {/* Header */}
          <header
            style={{
              position: 'fixed',
              top: '64px', // After TopNav
              left: 0,
              right: 0,
              height: '60px',
              background: isNeonNoir ? 'var(--bg-2)' : '#343541',
              borderBottom: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              padding: '0 1rem'
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  style={{
                    display: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                  onClick={() => {
                    const sidebar = document.getElementById('sidebar')
                    if (sidebar) {
                      sidebar.classList.toggle('mobile-open')
                    }
                  }}
                >
                  ☰
                </button>

                <a
                  href="#"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
                    textDecoration: 'none'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: isNeonNoir ? 'var(--accent)' : '#10a37f',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}
                  >
                    🚀
                  </div>
                  <span>AI SEARCH</span>
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: isNeonNoir ? 'var(--accent)' : '#10a37f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = '0.8'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  U
                </div>
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <aside
            id="sidebar"
            style={{
              position: 'fixed',
              left: 0,
              top: '124px', // After both headers
              width: '260px',
              height: 'calc(100vh - 124px)',
              background: isNeonNoir ? 'var(--bg-1)' : '#2d2d2d',
              borderRight: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
              overflowY: 'auto',
              transition: 'transform 0.3s ease',
              zIndex: 999
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
                  borderRadius: '6px',
                  color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = isNeonNoir ? 'var(--bg-2)' : '#40414f'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                onClick={() => {
                  // New chat functionality
                  const welcomeScreen = document.getElementById('welcomeScreen')
                  const chatMessages = document.getElementById('chatMessages')
                  if (welcomeScreen && chatMessages) {
                    welcomeScreen.style.display = 'flex'
                    chatMessages.classList.remove('active')
                  }
                }}
              >
                <span>➕</span>
                <span>Yeni Sohbet</span>
              </button>
            </div>

            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isNeonNoir ? 'var(--text-muted)' : '#8e8ea0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}
              >
                AI Modelleri
              </div>

              {/* AI Models List */}
              {[
                { id: 'all', name: 'Tüm Modeller', status: 'Hepsi aktif', icon: '🌐', active: true },
                { id: 'chatgpt', name: 'ChatGPT', status: 'GPT-4 Turbo', icon: '🤖', active: false },
                { id: 'claude', name: 'Claude', status: 'Claude 3.5', icon: '🧠', active: false },
                { id: 'gemini', name: 'Gemini', status: 'Gemini Pro', icon: '💎', active: false },
                { id: 'dalle', name: 'DALL-E', status: 'DALL-E 3', icon: '🎨', active: false },
                { id: 'midjourney', name: 'Midjourney', status: 'V6', icon: '🖼️', active: false }
              ].map((model) => (
                <div
                  key={model.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: model.active ? (isNeonNoir ? 'var(--bg-2)' : '#40414f') : 'transparent',
                    border: model.active ? `1px solid ${isNeonNoir ? 'var(--accent)' : '#10a37f'}` : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    if (!model.active) {
                      e.currentTarget.style.background = isNeonNoir ? 'var(--bg-2)' : '#40414f'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!model.active) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}
                  >
                    {model.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: isNeonNoir ? 'var(--text-primary)' : '#ececf1'
                      }}
                    >
                      {model.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: isNeonNoir ? 'var(--text-muted)' : '#8e8ea0'
                      }}
                    >
                      {model.status}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: isNeonNoir ? 'var(--accent)' : '#10a37f',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main
            style={{
              marginLeft: '260px',
              marginTop: '124px', // After both headers
              minHeight: 'calc(100vh - 124px)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'margin-left 0.3s ease'
            }}
          >
            {/* Chat Container */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '48rem',
                margin: '0 auto',
                width: '100%',
                padding: '2rem 1rem'
              }}
            >
              {/* Welcome Screen */}
              <div
                id="welcomeScreen"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '2rem'
                }}
              >
                <h1
                  style={{
                    fontSize: '2rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    background: `linear-gradient(135deg, ${isNeonNoir ? 'var(--accent)' : '#10a37f'} 0%, #10d37f 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  AI SEARCH'e Hoş Geldiniz
                </h1>
                <p
                  style={{
                    color: isNeonNoir ? 'var(--text-muted)' : '#c5c5d2',
                    marginBottom: '3rem'
                  }}
                >
                  Tüm AI modellerini tek platformda kullanın
                </p>

                {/* Feature Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    width: '100%',
                    maxWidth: '800px',
                    marginBottom: '2rem'
                  }}
                >
                  {[
                    { icon: '💻', title: 'Kod Yaz', desc: 'React, Python, Java ve daha fazlası' },
                    { icon: '🎨', title: 'Görsel Oluştur', desc: 'DALL-E ve Midjourney ile' },
                    { icon: '📊', title: 'Veri Analizi', desc: 'Dosyalarınızı analiz edin' },
                    { icon: '✍️', title: 'İçerik Yaz', desc: 'Blog, makale, rapor' }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        background: isNeonNoir ? 'var(--bg-2)' : '#343541',
                        border: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
                        borderRadius: '8px',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = isNeonNoir ? 'rgba(255,255,255,0.05)' : '#40414f'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = isNeonNoir ? 'var(--bg-2)' : '#343541'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                        {feature.icon}
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {feature.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: isNeonNoir ? 'var(--text-muted)' : '#8e8ea0'
                        }}
                      >
                        {feature.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div
                id="chatMessages"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '2rem 0',
                  display: 'none'
                }}
                className="active"
              >
                {/* Chat messages will be populated here */}
              </div>
            </div>

            {/* Input Container */}
            <div
              style={{
                borderTop: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
                padding: '1rem',
                background: isNeonNoir ? 'var(--bg-2)' : '#343541'
              }}
            >
              <div
                style={{
                  maxWidth: '48rem',
                  margin: '0 auto',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isNeonNoir ? 'var(--bg-0)' : '#40414f',
                    border: `1px solid ${isNeonNoir ? 'var(--border)' : '#4e4f60'}`,
                    borderRadius: '8px',
                    padding: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0 0.5rem'
                    }}
                  >
                    {['📷', '🎤', '🎬', '📎'].map((icon, index) => (
                      <button
                        key={index}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          color: isNeonNoir ? 'var(--text-muted)' : '#8e8ea0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = isNeonNoir ? 'var(--bg-1)' : '#2d2d2d'
                          e.currentTarget.style.color = isNeonNoir ? 'var(--text-primary)' : '#ececf1'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = isNeonNoir ? 'var(--text-muted)' : '#8e8ea0'
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Mesajınızı yazın..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: isNeonNoir ? 'var(--text-primary)' : '#ececf1',
                      fontSize: '0.875rem',
                      padding: '0.5rem',
                      outline: 'none',
                      resize: 'none',
                      minHeight: '24px',
                      maxHeight: '200px'
                    }}
                    rows={1}
                  />
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isNeonNoir ? 'var(--accent)' : '#10a37f',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginRight: '0.5rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = isNeonNoir ? 'rgba(255,255,255,0.8)' : '#1a7f64'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = isNeonNoir ? 'var(--accent)' : '#10a37f'
                    }}
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </main>

          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }

            @media (max-width: 768px) {
              aside {
                transform: translateX(-100%);
              }

              aside.mobile-open {
                transform: translateX(0);
              }

              main {
                margin-left: 0;
              }

              header button {
                display: block !important;
              }
            }

            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }

            ::-webkit-scrollbar-track {
              background: ${isNeonNoir ? 'var(--bg-1)' : '#2d2d2d'};
            }

            ::-webkit-scrollbar-thumb {
              background: ${isNeonNoir ? 'var(--border)' : '#4e4f60'};
              border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
              background: ${isNeonNoir ? 'var(--text-muted)' : '#8e8ea0'};
            }
          `}</style>
        </div>
      </div>
    </>
  )
}