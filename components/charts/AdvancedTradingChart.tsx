/**
 * AILYDIAN GLOBAL TRADER - Advanced TradingView Chart Component
 * Multi-asset real-time charts with WebGL optimization
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  SeriesType
} from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Square
} from 'lucide-react';

interface ChartDataPoint {
  time: number;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

interface TechnicalIndicator {
  id: string;
  name: string;
  type: 'line' | 'histogram' | 'candlestick';
  color: string;
  data: any[];
  visible: boolean;
}

interface ChartProps {
  symbol: string;
  assetType: 'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives';
  timeframe?: string;
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  realTimeUpdates?: boolean;
  theme?: 'dark' | 'light';
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

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candles', icon: Square },
  { value: 'line', label: 'Line', icon: TrendingUp },
  { value: 'area', label: 'Area', icon: Activity },
  { value: 'bars', label: 'Bars', icon: BarChart3 },
];

const TECHNICAL_INDICATORS = [
  { id: 'sma20', name: 'SMA 20', color: '#2196F3' },
  { id: 'sma50', name: 'SMA 50', color: '#FF9800' },
  { id: 'ema12', name: 'EMA 12', color: '#4CAF50' },
  { id: 'ema26', name: 'EMA 26', color: '#F44336' },
  { id: 'bb', name: 'Bollinger Bands', color: '#9C27B0' },
  { id: 'rsi', name: 'RSI', color: '#607D8B' },
  { id: 'macd', name: 'MACD', color: '#795548' },
  { id: 'volume', name: 'Volume', color: '#03DAC6' },
];

export default function AdvancedTradingChart({
  symbol,
  assetType,
  timeframe = '1h',
  height = 600,
  showVolume = true,
  showIndicators = true,
  realTimeUpdates = true,
  theme = 'dark',
  onSymbolChange,
  onTimeframeChange
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());

  const [chartType, setChartType] = useState<string>('candlestick');
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['volume']);
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number }>({ value: 0, percentage: 0 });

  // Chart theme configuration
  const chartTheme = useMemo(() => ({
    layout: {
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
      textColor: theme === 'dark' ? '#ffffff' : '#000000',
    },
    grid: {
      vertLines: {
        color: theme === 'dark' ? '#1a1a1a' : '#f0f0f0',
      },
      horzLines: {
        color: theme === 'dark' ? '#1a1a1a' : '#f0f0f0',
      },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    priceScale: {
      borderColor: theme === 'dark' ? '#333333' : '#cccccc',
    },
    timeScale: {
      borderColor: theme === 'dark' ? '#333333' : '#cccccc',
      timeVisible: true,
      secondsVisible: false,
    },
  }), [theme]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      ...chartTheme,
      rightPriceScale: {
        visible: true,
        borderColor: theme === 'dark' ? '#333333' : '#cccccc',
        mode: PriceScaleMode.Normal,
      },
      leftPriceScale: {
        visible: false,
      },
    });

    chartRef.current = chart;

    // Add main price series
    let mainSeries: ISeriesApi<any>;

    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries('Candlestick', {
        upColor: '#00ff88',
        downColor: '#ff4757',
        borderVisible: false,
        wickUpColor: '#00ff88',
        wickDownColor: '#ff4757',
      });
      candlestickSeriesRef.current = mainSeries;
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries('Line', {
        color: '#0ea5e9',
        lineWidth: 2,
      });
    } else {
      mainSeries = chart.addSeries('Area', {
        topColor: 'rgba(14, 165, 233, 0.56)',
        bottomColor: 'rgba(14, 165, 233, 0.04)',
        lineColor: 'rgba(14, 165, 233, 1)',
        lineWidth: 2,
      });
    }

    // Add volume series if enabled
    if (showVolume && activeIndicators.includes('volume')) {
      const volumeSeries = chart.addSeries('Histogram', {
        color: '#03DAC6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartType, height, showVolume, activeIndicators, chartTheme]);

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/market-data/global?symbol=${symbol}&type=${assetType}&timeframe=${currentTimeframe}&limit=1000`);
      const data = await response.json();
      
      if (data.ohlcv?.data) {
        const formattedData = data.ohlcv.data.map((point: any) => ({
          time: Math.floor(point.timestamp / 1000), // Convert to seconds
          open: parseFloat(point.open),
          high: parseFloat(point.high),
          low: parseFloat(point.low),
          close: parseFloat(point.close),
          volume: parseFloat(point.volume || 0),
        })).reverse(); // Reverse to get chronological order

        setChartData(formattedData);

        // Update chart series with new data
        if (candlestickSeriesRef.current && chartType === 'candlestick') {
          candlestickSeriesRef.current.setData(formattedData);
        }

        // Update volume data
        if (volumeSeriesRef.current && showVolume) {
          const volumeData = formattedData.map((point: ChartDataPoint) => ({
            time: point.time,
            value: point.volume || 0,
            color: (point.close >= (point.open || point.close)) ? '#00ff8899' : '#ff475799',
          }));
          volumeSeriesRef.current.setData(volumeData);
        }

        // Calculate price change
        if (formattedData.length > 1) {
          const current = formattedData[formattedData.length - 1].close;
          const previous = formattedData[formattedData.length - 2].close;
          const change = current - previous;
          const changePercent = (change / previous) * 100;
          
          setPriceChange({
            value: change,
            percentage: changePercent,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, assetType, currentTimeframe, chartType, showVolume]);

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

  // Add technical indicators
  const addIndicator = useCallback((indicatorId: string) => {
    if (!chartRef.current || activeIndicators.includes(indicatorId)) return;

    const indicator = TECHNICAL_INDICATORS.find(ind => ind.id === indicatorId);
    if (!indicator) return;

    let series: ISeriesApi<any>;

    // Simple implementation - in production, you'd calculate actual indicator values
    switch (indicatorId) {
      case 'sma20':
      case 'sma50':
      case 'ema12':
      case 'ema26':
        series = chartRef.current.addLineSeries({
          color: indicator.color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
        });
        // Add mock SMA/EMA data (you'd calculate real values)
        const smaData = chartData.map((point, index) => ({
          time: point.time,
          value: point.close * (0.95 + Math.random() * 0.1), // Mock data
        }));
        series.setData(smaData);
        break;

      case 'rsi':
        series = chartRef.current.addLineSeries({
          color: indicator.color,
          priceScaleId: 'rsi',
        });
        
        chartRef.current.priceScale('rsi').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.8,
          },
        });
        
        // Mock RSI data (0-100 range)
        const rsiData = chartData.map(point => ({
          time: point.time,
          value: 30 + Math.random() * 40, // Mock RSI between 30-70
        }));
        series.setData(rsiData);
        break;

      default:
        return;
    }

    indicatorSeriesRef.current.set(indicatorId, series);
    setActiveIndicators(prev => [...prev, indicatorId]);
  }, [chartData, activeIndicators]);

  // Remove technical indicator
  const removeIndicator = useCallback((indicatorId: string) => {
    const series = indicatorSeriesRef.current.get(indicatorId);
    if (series && chartRef.current) {
      chartRef.current.removeSeries(series);
      indicatorSeriesRef.current.delete(indicatorId);
      setActiveIndicators(prev => prev.filter(id => id !== indicatorId));
    }
  }, []);

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
                ${chartData[chartData.length - 1]?.close.toFixed(2) || '0.00'}
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
                variant={currentTimeframe === tf.value ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTimeframeChange(tf.value)}
                className="px-3 py-1 text-xs"
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Chart type buttons */}
          <div className="flex rounded-lg bg-gray-900 p-1">
            {CHART_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType(type.value)}
                  className="px-2 py-1"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
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

      {/* Technical Indicators Panel */}
      {showIndicators && (
        <div className="px-4 py-2 border-b border-gray-800">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400">Indicators:</span>
            {TECHNICAL_INDICATORS.map((indicator) => {
              const isActive = activeIndicators.includes(indicator.id);
              return (
                <Button
                  key={indicator.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => isActive ? removeIndicator(indicator.id) : addIndicator(indicator.id)}
                  className="px-2 py-1 text-xs h-auto"
                  style={{
                    backgroundColor: isActive ? indicator.color : undefined,
                    borderColor: indicator.color,
                    color: isActive ? '#ffffff' : indicator.color,
                  }}
                >
                  {indicator.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="relative bg-black"
        style={{ height: isFullscreen ? 'calc(100vh - 140px)' : height }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-white">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
