/**
 * 📊 AILYDIAN Chart Theme - Premium Trading Chart Styling
 * TradingView & Chart.js compatible theme with premium palette
 * © Emrah Şardağ. All rights reserved.
 */

// TradingView Chart Theme
export const tradingViewTheme = {
  // Background Colors
  background: '#0B1013',
  gridColor: '#1A1F23',
  
  // Chart Colors
  upColor: '#B9FF5D',
  downColor: '#FF4757',
  borderUpColor: '#B9FF5D',
  borderDownColor: '#FF4757',
  wickUpColor: '#B9FF5D',
  wickDownColor: '#FF4757',

  // Volume Colors
  volumeUpColor: 'rgba(185, 255, 93, 0.3)',
  volumeDownColor: 'rgba(255, 71, 87, 0.3)',

  // Series Colors
  lineColor: '#6CE7DA',
  topColor: 'rgba(108, 231, 218, 0.3)',
  bottomColor: 'rgba(108, 231, 218, 0.0)',

  // Text Colors
  textColor: '#E5E7EB',
  crosshairLabelBgColor: '#1A1F23',

  // Interface Colors
  watermark: 'rgba(229, 231, 235, 0.1)',
  paneBackgroundColor: '#0B1013',
  
  // Timeframe Colors
  timeframeActive: '#6CE7DA',
  timeframeInactive: '#6B7280',

  // Indicators
  ma1Color: '#6CE7DA', // Brand 1 - Cyan
  ma2Color: '#8A7CFF', // Brand 2 - Purple  
  ma3Color: '#B9FF5D', // Accent 1 - Green
  rsiColor: '#6CE7DA',
  macdColor: '#8A7CFF',
  bollinger: {
    upper: '#B9FF5D',
    middle: '#6CE7DA', 
    lower: '#8A7CFF'
  }
};

// Chart.js Theme Configuration
export const chartJsTheme = {
  backgroundColor: 'rgba(11, 16, 19, 0.95)',
  borderColor: 'rgba(26, 31, 35, 0.5)',
  color: '#E5E7EB',
  gridColor: 'rgba(26, 31, 35, 0.3)',
  
  datasets: {
    // Candlestick Colors
    candlestick: {
      upColor: '#B9FF5D',
      downColor: '#FF4757',
      upBorderColor: '#B9FF5D',
      downBorderColor: '#FF4757',
      wickColor: '#6B7280'
    },
    
    // Line Chart Colors
    line: {
      borderColor: '#6CE7DA',
      backgroundColor: 'rgba(108, 231, 218, 0.1)',
      pointBackgroundColor: '#6CE7DA',
      pointBorderColor: '#0B1013',
      tension: 0.4
    },
    
    // Area Chart Colors
    area: {
      borderColor: '#6CE7DA',
      backgroundColor: 'linear-gradient(to bottom, rgba(108, 231, 218, 0.3), rgba(108, 231, 218, 0.0))',
    },
    
    // Volume Colors
    volume: {
      upColor: 'rgba(185, 255, 93, 0.6)',
      downColor: 'rgba(255, 71, 87, 0.6)'
    }
  },

  // Tooltip Styling  
  tooltip: {
    backgroundColor: 'rgba(26, 31, 35, 0.95)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    borderWidth: 1,
    cornerRadius: 12,
    titleColor: '#F9FAFB',
    bodyColor: '#E5E7EB',
    footerColor: '#9CA3AF',
    padding: 12
  },

  // Legend Styling
  legend: {
    labels: {
      color: '#E5E7EB',
      usePointStyle: true,
      pointStyle: 'circle'
    }
  },

  // Scale Styling
  scales: {
    x: {
      grid: {
        color: 'rgba(26, 31, 35, 0.3)',
        borderColor: 'rgba(107, 114, 128, 0.3)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    },
    y: {
      grid: {
        color: 'rgba(26, 31, 35, 0.3)',
        borderColor: 'rgba(107, 114, 128, 0.3)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    }
  }
};

// OrderBook Theme
export const orderBookTheme = {
  background: '#0B1013',
  headerBg: 'rgba(26, 31, 35, 0.5)',
  borderColor: 'rgba(26, 31, 35, 0.3)',
  
  // Price Colors
  bidColor: '#B9FF5D',
  askColor: '#FF4757',
  spreadColor: '#6CE7DA',
  
  // Background Gradients
  bidBackground: 'linear-gradient(to right, rgba(185, 255, 93, 0.1), transparent)',
  askBackground: 'linear-gradient(to right, rgba(255, 71, 87, 0.1), transparent)',
  
  // Text Colors
  priceText: '#F9FAFB',
  sizeText: '#E5E7EB',
  totalText: '#9CA3AF',
  
  // Hover Effects
  rowHover: 'rgba(26, 31, 35, 0.5)',
  
  // Market Depth Colors
  depthBid: 'rgba(185, 255, 93, 0.2)',
  depthAsk: 'rgba(255, 71, 87, 0.2)'
};

// Heatmap Colors for Crypto Market
export const heatmapColors = {
  positive: [
    'rgba(185, 255, 93, 0.2)', // +0-2%
    'rgba(185, 255, 93, 0.4)', // +2-5% 
    'rgba(185, 255, 93, 0.6)', // +5-10%
    'rgba(185, 255, 93, 0.8)', // +10%+
  ],
  negative: [
    'rgba(255, 71, 87, 0.2)', // -0-2%
    'rgba(255, 71, 87, 0.4)', // -2-5%
    'rgba(255, 71, 87, 0.6)', // -5-10%
    'rgba(255, 71, 87, 0.8)', // -10%+
  ],
  neutral: 'rgba(107, 114, 128, 0.2)'
};

// Portfolio Chart Colors
export const portfolioColors = [
  '#6CE7DA', // Brand 1
  '#8A7CFF', // Brand 2
  '#B9FF5D', // Accent 1
  '#FF4757', // Negative
  '#F59E0B', // Warning
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F97316', // Orange
  '#EC4899', // Pink
];

// Animation Configurations
export const chartAnimations = {
  duration: 750,
  easing: 'easeInOutQuart',
  
  // Hover Animations
  hover: {
    animationDuration: 200
  },
  
  // Responsive Animations
  responsiveAnimationDuration: 500,
  
  // Loading Animation
  loading: {
    duration: 1000,
    loop: true
  }
};

// Export combined theme object
export const premiumChartTheme = {
  tradingView: tradingViewTheme,
  chartJs: chartJsTheme,
  orderBook: orderBookTheme,
  heatmap: heatmapColors,
  portfolio: portfolioColors,
  animations: chartAnimations
};

export default premiumChartTheme;
