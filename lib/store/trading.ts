import { create } from 'zustand';

interface TradingState {
  // Market Data
  currentPrice: number;
  orderBook: { bids: any[]; asks: any[] };
  positions: any[];
  orders: any[];
  balance: { [key: string]: number };
  
  // Bot State
  botMode: 'semi' | 'auto' | 'off';
  botSignal: number;
  killSwitch: boolean;
  
  // Settings
  selectedSymbol: string;
  leverage: number;
  riskSettings: {
    maxDailyLoss: number;
    maxSingleTrade: number;
  };
  
  // Actions
  setBotMode: (mode: 'semi' | 'auto' | 'off') => void;
  setKillSwitch: (enabled: boolean) => void;
  setSelectedSymbol: (symbol: string) => void;
  updatePrice: (price: number) => void;
  updateSignal: (signal: number) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  // Initial State
  currentPrice: 67234.50,
  orderBook: { bids: [], asks: [] },
  positions: [],
  orders: [],
  balance: { USDT: 5432.10, BTC: 0.1234 },
  
  botMode: 'semi',
  botSignal: 85.2,
  killSwitch: false,
  
  selectedSymbol: 'BTCUSDT',
  leverage: 10,
  riskSettings: {
    maxDailyLoss: 500,
    maxSingleTrade: 100,
  },
  
  // Actions
  setBotMode: (mode) => set({ botMode: mode }),
  setKillSwitch: (enabled) => set({ killSwitch: enabled }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  updatePrice: (price) => set({ currentPrice: price }),
  updateSignal: (signal) => set({ botSignal: signal }),
}));
