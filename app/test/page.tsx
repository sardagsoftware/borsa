'use client';

import { useState } from 'react';

export default function TestPage() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="panel p-6">
          <h1 className="text-3xl font-bold text-binance-yellow mb-4">
            🧪 AiLydian Trader TEMA TEST
          </h1>
          <p className="text-binance-textSecondary">
            Current theme: <span className="text-binance-text font-mono">{theme}</span>
          </p>
          <button 
            onClick={toggleTheme}
            className="btn-primary mt-4"
          >
            Toggle Theme
          </button>
        </div>

        {/* Color Palette Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Color Palette Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-dark rounded-lg mx-auto mb-2 border-2 border-border"></div>
              <p className="text-sm text-binance-textSecondary">Dark</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-panel rounded-lg mx-auto mb-2 border-2 border-border"></div>
              <p className="text-sm text-binance-textSecondary">Panel</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-yellow rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-binance-textSecondary">Yellow</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-green rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-binance-textSecondary">Green</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-red rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-binance-textSecondary">Red</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-blue rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-binance-textSecondary">Blue</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-binance-purple rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-binance-textSecondary">Purple</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-card rounded-lg mx-auto mb-2 border-2 border-border"></div>
              <p className="text-sm text-binance-textSecondary">Card</p>
            </div>
          </div>
        </div>

        {/* Button Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Button Components Test</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-buy">Buy Button</button>
            <button className="btn-sell">Sell Button</button>
            <button className="btn-secondary">Secondary Button</button>
          </div>
        </div>

        {/* Form Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Form Components Test</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Test input field"
              className="input-primary w-full"
            />
            <textarea 
              placeholder="Test textarea"
              className="input-primary w-full h-20"
            />
          </div>
        </div>

        {/* Price Display Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Price Display Test</h2>
          <div className="space-y-2">
            <div className="price-up text-lg font-mono">+$50,123.45 (↗️ +2.35%)</div>
            <div className="price-down text-lg font-mono">-$48,987.21 (↘️ -1.85%)</div>
            <div className="price-neutral text-lg font-mono">$49,555.33 (→ 0.00%)</div>
          </div>
        </div>

        {/* Status Indicators Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Status Indicators Test</h2>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="status-online"></div>
              <span className="text-binance-textSecondary">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="status-offline"></div>
              <span className="text-binance-textSecondary">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="status-warning"></div>
              <span className="text-binance-textSecondary">Warning</span>
            </div>
          </div>
        </div>

        {/* Order Book Style Test */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">Order Book Style Test</h2>
          <div className="space-y-1">
            <div className="order-book-ask p-2 rounded text-sm font-mono">
              ASK: 50,125.50 - 0.0234 BTC
            </div>
            <div className="order-book-bid p-2 rounded text-sm font-mono">
              BID: 50,120.25 - 0.0156 BTC
            </div>
          </div>
        </div>

        {/* CSS Variables Check */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">CSS Variables Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <strong>Background:</strong>
              <div className="mt-1 p-2 rounded" style={{backgroundColor: 'var(--background)'}}>
                var(--background)
              </div>
            </div>
            <div>
              <strong>Foreground:</strong>
              <div className="mt-1 p-2 rounded bg-muted" style={{color: 'var(--foreground)'}}>
                var(--foreground)
              </div>
            </div>
            <div>
              <strong>Primary:</strong>
              <div className="mt-1 p-2 rounded" style={{backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)'}}>
                var(--primary)
              </div>
            </div>
            <div>
              <strong>Card:</strong>
              <div className="mt-1 p-2 rounded border" style={{backgroundColor: 'var(--card)', borderColor: 'var(--border)'}}>
                var(--card)
              </div>
            </div>
          </div>
        </div>

        {/* DOM Theme Class Check */}
        <div className="panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-binance-text">DOM Theme Check</h2>
          <div className="space-y-2 text-sm">
            <p>HTML classList: <span className="font-mono text-binance-yellow">{typeof window !== 'undefined' ? document.documentElement.classList.toString() : 'N/A'}</span></p>
            <p>Body classList: <span className="font-mono text-binance-yellow">{typeof window !== 'undefined' ? document.body.classList.toString() : 'N/A'}</span></p>
            <p>Dark mode active: <span className="font-mono text-binance-yellow">{typeof window !== 'undefined' ? document.documentElement.classList.contains('dark').toString() : 'N/A'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
