/**
 * TRADINGVIEW MINI CHART
 * Lightweight mini chart for coin cards
 */

'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewMiniChartProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  isTransparent?: boolean;
  dateRange?: '1D' | '1M' | '3M' | '1Y' | '5Y' | 'ALL';
}

function TradingViewMiniChart({
  symbol = 'BINANCE:BTCUSDT',
  width = '100%',
  height = 80,
  theme = 'dark',
  autosize = true,
  isTransparent = true,
  dateRange = '1M',
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create unique container ID
    const containerId = `tradingview_mini_${Math.random().toString(36).substring(7)}`;
    container.id = containerId;

    // Create script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    scriptRef.current = script;

    const config = {
      symbol: symbol,
      width: autosize ? '100%' : width,
      height: height,
      locale: 'tr_TR',
      dateRange: dateRange,
      colorTheme: theme,
      isTransparent: isTransparent,
      autosize: autosize,
      largeChartUrl: '',
    };

    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);

    return () => {
      // Cleanup
      if (container && scriptRef.current) {
        container.removeChild(scriptRef.current);
      }
    };
  }, [symbol, width, height, theme, autosize, isTransparent, dateRange]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ position: 'relative', width: '100%', height }}
    />
  );
}

export default memo(TradingViewMiniChart);
