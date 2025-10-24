/**
 * TRADINGVIEW TICKER TAPE
 * Scrolling ticker tape with live prices
 */

'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewTickerTapeProps {
  symbols?: Array<{
    proName: string;
    title: string;
  }>;
  showSymbolLogo?: boolean;
  isTransparent?: boolean;
  displayMode?: 'adaptive' | 'regular' | 'compact';
  colorTheme?: 'light' | 'dark';
}

function TradingViewTickerTape({
  symbols = [
    { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
    { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
    { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
    { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
    { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
    { proName: 'BINANCE:ADAUSDT', title: 'Cardano' },
    { proName: 'BINANCE:DOGEUSDT', title: 'Dogecoin' },
    { proName: 'BINANCE:DOTUSDT', title: 'Polkadot' },
  ],
  showSymbolLogo = true,
  isTransparent = true,
  displayMode = 'adaptive',
  colorTheme = 'dark',
}: TradingViewTickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    scriptRef.current = script;

    const config = {
      symbols: symbols,
      showSymbolLogo: showSymbolLogo,
      isTransparent: isTransparent,
      displayMode: displayMode,
      colorTheme: colorTheme,
      locale: 'tr_TR',
    };

    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);

    return () => {
      // Cleanup
      if (container && scriptRef.current) {
        container.removeChild(scriptRef.current);
      }
    };
  }, [symbols, showSymbolLogo, isTransparent, displayMode, colorTheme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ position: 'relative', width: '100%', height: 46 }}
    />
  );
}

export default memo(TradingViewTickerTape);
