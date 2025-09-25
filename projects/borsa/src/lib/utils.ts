import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  notation: 'standard' | 'compact' = 'standard'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    maximumFractionDigits: notation === 'compact' ? 2 : amount < 1 ? 6 : 2,
  }).format(amount);
}

export function formatNumber(
  num: number,
  notation: 'standard' | 'compact' = 'standard'
): string {
  return new Intl.NumberFormat('en-US', {
    notation,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(percent: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percent / 100);
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  }
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  }
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return formatCurrency(marketCap, 'USD', 'compact');
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toFixed(0);
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getChangeBgColor(change: number): string {
  if (change > 0) return 'bg-green-50 border-green-200';
  if (change < 0) return 'bg-red-50 border-red-200';
  return 'bg-gray-50 border-gray-200';
}

export function generateMockPriceHistory(
  currentPrice: number,
  days: number = 30
): Array<{ timestamp: string; price: number }> {
  const history = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Mock price with some random variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = currentPrice * (1 + variation * (i / days));
    
    history.push({
      timestamp: date.toISOString(),
      price: Math.max(price, 0.01), // Ensure positive price
    });
  }
  
  return history;
}