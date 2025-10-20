/**
 * TRADINGVIEW MARKET SCREENER
 * Advanced market screener widget
 */

'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewScreenerProps {
  width?: string | number;
  height?: string | number;
  defaultColumn?: string;
  defaultScreen?: string;
  market?: 'crypto' | 'forex' | 'america' | 'global';
  showToolbar?: boolean;
  colorTheme?: 'light' | 'dark';
  locale?: string;
  isTransparent?: boolean;
}

function TradingViewScreener({
  width = '100%',
  height = 523,
  defaultColumn = 'overview',
  defaultScreen = 'general',
  market = 'crypto',
  showToolbar = true,
  colorTheme = 'dark',
  locale = 'tr_TR',
  isTransparent = true,
}: TradingViewScreenerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    scriptRef.current = script;

    const config = {
      width: width,
      height: height,
      defaultColumn: defaultColumn,
      defaultScreen: defaultScreen,
      market: market,
      showToolbar: showToolbar,
      colorTheme: colorTheme,
      locale: locale,
      isTransparent: isTransparent,
    };

    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);

    return () => {
      // Cleanup
      if (container && scriptRef.current) {
        container.removeChild(scriptRef.current);
      }
    };
  }, [width, height, defaultColumn, defaultScreen, market, showToolbar, colorTheme, locale, isTransparent]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ position: 'relative', width: '100%', height }}
    />
  );
}

export default memo(TradingViewScreener);
