/**
 * AILYDIAN Global Trader Ultra Pro - Landing Page
 * Premium landing page with advanced features showcase
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import Link from 'next/link';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Globe, 
  Brain, 
  BarChart3, 
  Smartphone,
  ArrowRight,
  Star,
  CheckCircle,
  Activity
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Quantum-ML Portfolio Optimization",
      description: "Advanced quantum computing algorithms for portfolio optimization with classical ML fallbacks",
      link: "/quantum/portfolio"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Social Sentiment Analysis", 
      description: "FinBERT transformer model analyzing Twitter, Reddit, and StockTwits sentiment data",
      link: "/social/sentiment"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "News Intelligence & Trust Index",
      description: "AI-powered news analysis with trust scoring from premium financial sources",
      link: "/news/intelligence"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Auto-Trader AI Engine",
      description: "Machine learning trading signals with risk management and backtesting",
      link: "/trading/auto-trader"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Global Markets Integration",
      description: "Real-time data from worldwide markets with TradingView advanced charts",
      link: "/trading"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security & Monitoring",
      description: "Comprehensive system monitoring with enterprise-grade security measures",
      link: "/monitoring"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20" />
        <div className="container mx-auto px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full text-sm font-medium border border-cyan-500/30 neon-glow">
                � Ultra Pro Edition
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-display gradient-text leading-tight">
              AILYDIAN
              <br />
              Global Trader
              <br />
              <span className="text-4xl md:text-5xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Ultra Pro
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
              The world's most advanced AI-powered global trading platform combining
              <span className="text-cyan-400 font-semibold"> quantum computing</span>,
              <span className="text-green-400 font-semibold"> machine learning</span>, and
              <span className="text-purple-400 font-semibold"> real-time intelligence</span>
              <br />
              for institutional-grade trading performance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/dashboard" 
                className="btn-premium text-lg px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Zap className="w-6 h-6" />
                Launch Trading Platform
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/monitoring" 
                className="btn-premium text-lg px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500"
              >
                <Activity className="w-6 h-6" />
                System Monitoring
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">5</div>
                <div className="text-slate-400 text-sm">AI Microservices</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
                <div className="text-slate-400 text-sm">Global Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-slate-400 text-sm">Live Trading</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">99.9%</div>
                <div className="text-slate-400 text-sm">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-display">
              Revolutionary Trading Technology
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Powered by cutting-edge artificial intelligence, quantum computing, and real-time market intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link 
                key={index}
                href={feature.link}
                className="card-premium p-8 group cursor-pointer"
              >
                <div className="flex items-center mb-6">
                  <div className="text-cyan-400 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-display">
              Enterprise Technology Stack
            </h2>
            <p className="text-xl text-slate-400">
              Built with production-ready technologies for maximum performance and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              'Next.js 14', 'Python FastAPI', 'PostgreSQL', 'TimescaleDB', 
              'Redis', 'Docker', 'Qiskit', 'TensorFlow', 'FinBERT', 'TradingView'
            ].map((tech, index) => (
              <div key={index} className="text-center p-4 glass-panel rounded-lg">
                <div className="text-sm font-semibold text-cyan-400">{tech}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="card-premium p-12 text-center max-w-4xl mx-auto bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the next generation of algorithmic trading with AILYDIAN's quantum-enhanced AI platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="btn-premium text-lg px-8 py-4"
              >
                <Globe className="w-6 h-6" />
                Start Trading Now
              </Link>
              
              <Link 
                href="/monitoring"
                className="btn-premium text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <BarChart3 className="w-6 h-6" />
                View Live System Status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-slate-400 mb-4">
              © 2025 Emrah Şardağ. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              AILYDIAN Global Trader Ultra Pro - Revolutionary AI-Powered Trading Platform
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
