/**
 * AILYDIAN GLOBAL TRADER - Simplified TradingView Chart Component
 * Multi-asset real-time charts with basic functionality
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Maximize2,
  Minimize2,
  RefreshCw,
  Square
} from 'lucide-react';

interface ChartDataPoint {
  time: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

interface TradingChartProps {
  symbol: string;
  assetType: 'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives';
  timeframe?: string;
  height?: number;
  realTimeUpdates?: boolean;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
}

const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

export default function TradingChart({
  symbol,
  assetType,
  timeframe = '1h',
  height = 600,
  realTimeUpdates = true,
  onSymbolChange,
  onTimeframeChange
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number }>({ value: 0, percentage: 0 });
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/market-data/global?symbol=${symbol}&type=${assetType}&timeframe=${currentTimeframe}&limit=100`);
      const data = await response.json();
      
      if (data.ohlcv?.data && data.ohlcv.data.length > 0) {
        const formattedData = data.ohlcv.data.map((point: any) => ({
          time: new Date(point.timestamp).toLocaleTimeString(),
          open: parseFloat(point.open),
          high: parseFloat(point.high),
          low: parseFloat(point.low),
          close: parseFloat(point.close),
          volume: parseFloat(point.volume || 0),
        })).reverse().slice(-100); // Get last 100 points

        setChartData(formattedData);

        // Calculate price change
        if (formattedData.length > 1) {
          const current = formattedData[formattedData.length - 1].close;
          const previous = formattedData[formattedData.length - 2].close;
          const change = current - previous;
          const changePercent = (change / previous) * 100;
          
          setCurrentPrice(current);
          setPriceChange({
            value: change,
            percentage: changePercent,
          });
        }

        drawChart(formattedData);
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
      // Generate mock data for demo
      const mockData = generateMockData();
      setChartData(mockData);
      drawChart(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, assetType, currentTimeframe]);

  // Generate mock data for demo purposes
  const generateMockData = useCallback((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let price = 100 + Math.random() * 100;
    
    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.5) * 5;
      price += change;
      
      const high = price + Math.random() * 2;
      const low = price - Math.random() * 2;
      const open = i === 0 ? price : data[i - 1].close;
      
      data.push({
        time: new Date(Date.now() - (100 - i) * 60000).toLocaleTimeString(),
        open,
        high,
        low,
        close: price,
        volume: Math.random() * 10000
      });
    }
    
    if (data.length > 1) {
      const current = data[data.length - 1].close;
      const previous = data[data.length - 2].close;
      const change = current - previous;
      const changePercent = (change / previous) * 100;
      
      setCurrentPrice(current);
      setPriceChange({
        value: change,
        percentage: changePercent,
      });
    }
    
    return data;
  }, []);

  // Simple canvas-based chart drawing
  const drawChart = useCallback((data: ChartDataPoint[]) => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (!data.length) return;

    // Get price range
    const prices = data.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = priceChange.value >= 0 ? '#00ff88' : '#ff4757';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (width / (data.length - 1)) * index;
      const y = height - ((point.close - minPrice) / priceRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area fill
    ctx.fillStyle = priceChange.value >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)';
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Draw price labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * (5 - i);
      const y = (height / 5) * i + 5;
      ctx.fillText(price.toFixed(2), width - 5, y);
    }

  }, [priceChange.value]);

  // Load data on component mount and symbol change
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      loadChartData();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates, loadChartData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartData.length > 0) {
        drawChart(chartData);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData, drawChart]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setCurrentTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  }, [onTimeframeChange]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  return (
    <Card className={`relative bg-black/90 border-gray-800 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              {symbol}
              <span className="ml-2 text-sm text-gray-400 uppercase">{assetType}</span>
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-mono text-white">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-sm font-medium ${
                priceChange.value >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange.value >= 0 ? '+' : ''}
                {priceChange.value.toFixed(2)} ({priceChange.percentage.toFixed(2)}%)
              </span>
              {priceChange.value >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Timeframe buttons */}
          <div className="flex rounded-lg bg-gray-900 p-1">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf.value}
                variant={currentTimeframe === tf.value ? "primary" : "ghost"}
                size="sm"
                onClick={() => handleTimeframeChange(tf.value)}
                className="px-3 py-1 text-xs"
              >
                {tf.label}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadChartData}
            disabled={isLoading}
            className="px-2 py-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="px-2 py-1"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="relative bg-black"
        style={{ height: isFullscreen ? 'calc(100vh - 100px)' : height }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-white">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* Chart overlay info */}
        <div className="absolute top-4 left-4 text-white text-xs space-y-1">
          <div>Symbol: {symbol}</div>
          <div>Timeframe: {currentTimeframe}</div>
          <div>Data Points: {chartData.length}</div>
          <div className="text-gray-400">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
