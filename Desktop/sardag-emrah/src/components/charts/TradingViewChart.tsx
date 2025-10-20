/**
 * TRADINGVIEW CHART WIDGET
 * Professional charting with TradingView widget
 */

'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  autosize?: boolean;
  timezone?: string;
  locale?: string;
  enablePublishing?: boolean;
  withdateranges?: boolean;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  saveImage?: boolean;
  studies?: string[];
}

function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  interval = '240', // 4h
  theme = 'dark',
  width = '100%',
  height = 500,
  autosize = false,
  timezone = 'Etc/UTC',
  locale = 'tr_TR',
  enablePublishing = false,
  withdateranges = true,
  hideTopToolbar = false,
  hideSideToolbar = false,
  saveImage = true,
  studies = [],
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create unique container ID
    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;
    container.id = containerId;

    // Create and append script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    scriptRef.current = script;

    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          container_id: containerId,
          autosize: autosize,
          width: autosize ? '100%' : width,
          height: autosize ? '100%' : height,
          symbol: symbol,
          interval: interval,
          timezone: timezone,
          theme: theme,
          style: '1', // Candle style
          locale: locale,
          toolbar_bg: theme === 'dark' ? '#1A1D2E' : '#f1f3f6',
          enable_publishing: enablePublishing,
          withdateranges: withdateranges,
          hide_top_toolbar: hideTopToolbar,
          hide_side_toolbar: hideSideToolbar,
          allow_symbol_change: true,
          save_image: saveImage,
          studies: studies,
          // Advanced features
          details: true,
          hotlist: true,
          calendar: false,
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          support_host: 'https://www.tradingview.com',
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [
    symbol,
    interval,
    theme,
    width,
    height,
    autosize,
    timezone,
    locale,
    enablePublishing,
    withdateranges,
    hideTopToolbar,
    hideSideToolbar,
    saveImage,
    studies,
  ]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ position: 'relative', width: '100%', height: autosize ? '100%' : height }}
    />
  );
}

export default memo(TradingViewChart);
