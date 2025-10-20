export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Ailydian Ultra Pro
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            Enterprise-Grade AI Chat Core with Multi-Provider Routing
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-800/50 backdrop-blur p-6 rounded-xl border border-slate-700">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Multi-Provider</h3>
              <p className="text-slate-400">
                Route to OpenAI, Anthropic, Gemini, and more
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur p-6 rounded-xl border border-slate-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Smart Routing</h3>
              <p className="text-slate-400">
                Cost, latency, and quality optimized selection
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur p-6 rounded-xl border border-slate-700">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-slate-400">
                Zero-trust, encryption, and audit logging
              </p>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur p-8 rounded-2xl border border-slate-700">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <div className="text-left space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <code className="text-sm text-blue-300">
                  POST /api/chat/complete
                </code>
                <p className="text-slate-400 text-sm mt-2">
                  Send messages and get AI responses with automatic routing
                </p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg">
                <code className="text-sm text-blue-300">
                  GET /api/conversations?userId=&lt;id&gt;
                </code>
                <p className="text-slate-400 text-sm mt-2">
                  Retrieve conversation history with full persistence
                </p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg">
                <code className="text-sm text-blue-300">
                  POST /api/conversations
                </code>
                <p className="text-slate-400 text-sm mt-2">
                  Create new conversation threads
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-slate-400">
            <p>v2 Sprint Complete - Core Chat Infrastructure</p>
            <p className="text-sm mt-2">Next: v3 - Personalized Routing + Cost Optimization</p>
          </div>
        </div>
      </div>
    </main>
  );
}
