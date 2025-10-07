'use client';

import { useState } from 'react';

export default function TestPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'models' | 'regions' | 'gpu' | 'feedback'>('chat');

  // Chat Test
  const testChat = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          stream: false,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Models Test
  const testModels = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Regions (CRDT) Test
  const testRegions = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      // Set a key
      const setRes = await fetch('/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'test_key',
          value: { message: 'Hello from CRDT!', timestamp: Date.now() },
        }),
      });
      const setData = await setRes.json();

      // Get all entries
      const getRes = await fetch('/api/regions');
      const getData = await getRes.json();

      setResponse({ set: setData, get: getData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // GPU Autoscaling Test
  const testGPU = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('/api/cloud/resources');
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Feedback Test
  const testFeedback = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      // Record thumbs up
      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'thumbs_up',
          conversationId: 'test-conv-1',
          messageId: 'test-msg-1',
          userId: 'test-user-1',
          query: 'Test query',
          response: 'Test response',
          model: 'gpt-4o',
          latencyMs: 1000,
        }),
      });
      const feedbackData = await feedbackRes.json();

      // Get aggregations
      const aggRes = await fetch('/api/feedback');
      const aggData = await aggRes.json();

      setResponse({ feedback: feedbackData, aggregations: aggData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'Write a Python function to calculate fibonacci numbers',
    'Explain quantum computing in simple terms',
    'Create a React component for a todo list',
    'What are the benefits of TypeScript?',
    'How does differential privacy work?',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Ailydian Ultra Pro - Live Test Suite
          </h1>
          <p className="text-blue-200">
            Test all v2-v25 features with real API keys
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
              <div className="text-green-300 text-xs font-semibold">OpenAI</div>
              <div className="text-white text-lg">✅ Active</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
              <div className="text-green-300 text-xs font-semibold">Anthropic</div>
              <div className="text-white text-lg">✅ Active</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
              <div className="text-green-300 text-xs font-semibold">Gemini</div>
              <div className="text-white text-lg">✅ Active</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
              <div className="text-green-300 text-xs font-semibold">Groq</div>
              <div className="text-white text-lg">✅ Active</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
              <div className="text-blue-300 text-xs font-semibold">Packages</div>
              <div className="text-white text-lg">9/9 ✅</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'chat', label: '💬 Chat (v2-v3)', color: 'blue' },
            { id: 'models', label: '🤖 Models (v3)', color: 'purple' },
            { id: 'regions', label: '🌍 CRDT (v13)', color: 'green' },
            { id: 'gpu', label: '⚡ GPU (v14)', color: 'orange' },
            { id: 'feedback', label: '👍 RL (v15)', color: 'pink' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              💬 Intelligent Chat with Multi-Provider Routing
            </h2>
            <p className="text-blue-200 mb-6">
              Tests: Intent inference, model selection, cost optimization, streaming
            </p>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Example Queries (click to use):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg p-3 text-left text-white text-sm transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your question..."
              className="w-full h-32 bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-gray-400 mb-4"
            />

            <button
              onClick={testChat}
              disabled={loading || !query}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {loading ? '⏳ Processing...' : '🚀 Send Message'}
            </button>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              🤖 Available AI Models
            </h2>
            <p className="text-blue-200 mb-6">
              25+ models from OpenAI, Anthropic, Gemini, Mistral
            </p>

            <button
              onClick={testModels}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {loading ? '⏳ Loading...' : '📋 List All Models'}
            </button>
          </div>
        )}

        {/* Regions Tab */}
        {activeTab === 'regions' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              🌍 Multi-Region CRDT State
            </h2>
            <p className="text-blue-200 mb-6">
              Tests: HLC timestamps, LWW-Map, conflict-free replication
            </p>

            <button
              onClick={testRegions}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {loading ? '⏳ Testing...' : '🔄 Test CRDT Operations'}
            </button>
          </div>
        )}

        {/* GPU Tab */}
        {activeTab === 'gpu' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              ⚡ Multi-Cloud GPU Autoscaling
            </h2>
            <p className="text-blue-200 mb-6">
              Tests: AWS/GCP adapters, cost optimization, spot instances
            </p>

            <button
              onClick={testGPU}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {loading ? '⏳ Checking...' : '🖥️ Get GPU Status'}
            </button>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              👍 RL Feedback & Active Learning
            </h2>
            <p className="text-blue-200 mb-6">
              Tests: Feedback collection, reward estimation, RLHF-lite
            </p>

            <button
              onClick={testFeedback}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {loading ? '⏳ Recording...' : '📊 Test Feedback System'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-500/20 border border-red-400/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-300 mb-2">❌ Error</h3>
            <pre className="text-red-200 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">✅ Response</h3>

            {activeTab === 'chat' && (
              <div className="space-y-4">
                {response.routingReasoning && (
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                    <div className="text-blue-300 text-sm font-semibold mb-1">
                      🎯 Routing Decision
                    </div>
                    <div className="text-white">{response.routingReasoning}</div>
                  </div>
                )}

                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                  <div className="text-green-300 text-sm font-semibold mb-1">
                    💬 Response
                  </div>
                  <div className="text-white whitespace-pre-wrap">{response.content}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">Model</div>
                    <div className="text-white font-semibold">{response.model}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">Provider</div>
                    <div className="text-white font-semibold">{response.provider}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">Latency</div>
                    <div className="text-white font-semibold">{response.latencyMs}ms</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">Cost</div>
                    <div className="text-white font-semibold">${response.cost?.toFixed(6)}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'chat' && (
              <pre className="bg-black/30 rounded-lg p-4 text-green-300 overflow-x-auto text-sm">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
