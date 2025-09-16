/**
 * 📱 Mobile-First Trading Interface
 * Quick buy/sell actions optimized for thumb zones
 */

'use client';

import React, { useState, useRef } from 'react';
import { useDeviceDetection, useMobileClick, hapticFeedback } from './utils';
import { Sheet } from '../ui/sheet';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface QuickTradeProps {
  symbol?: string;
  price?: number;
  onTrade?: (side: 'buy' | 'sell', amount: number, price: number) => void;
}

export function QuickTrade({ symbol = 'BTC/USDT', price = 0, onTrade }: QuickTradeProps) {
  const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(price.toString());
  
  const { isMobile } = useDeviceDetection();
  const formRef = useRef<HTMLFormElement>(null);

  const handleQuickAction = (side: 'buy' | 'sell') => {
    hapticFeedback.medium();
    setTradeSide(side);
    setIsTradeSheetOpen(true);
  };

  const handleTrade = () => {
    const tradeAmount = parseFloat(amount);
    const tradePrice = orderType === 'market' ? price : parseFloat(limitPrice);
    
    if (tradeAmount > 0 && tradePrice > 0) {
      onTrade?.(tradeSide, tradeAmount, tradePrice);
      hapticFeedback.success();
      setIsTradeSheetOpen(false);
      setAmount('');
    } else {
      hapticFeedback.error();
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  if (!isMobile) {
    // Desktop fallback
    return (
      <div className="grid grid-cols-2 gap-4">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          onClick={() => handleQuickAction('buy')}
        >
          Buy {symbol}
        </Button>
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
          onClick={() => handleQuickAction('sell')}
        >
          Sell {symbol}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Quick Action Buttons */}
      <div className="fixed bottom-20 left-4 right-4 z-40">
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="
              bg-green-600 hover:bg-green-700 active:bg-green-800 
              text-white font-bold py-4 px-6 rounded-xl
              shadow-lg active:scale-95 transition-all duration-150
              min-h-[56px] flex items-center justify-center
            "
            onClick={() => handleQuickAction('buy')}
          >
            <div className="text-center">
              <div className="text-lg">📈 Buy</div>
              <div className="text-xs opacity-90">${price.toFixed(2)}</div>
            </div>
          </Button>
          
          <Button
            size="lg"
            className="
              bg-red-600 hover:bg-red-700 active:bg-red-800 
              text-white font-bold py-4 px-6 rounded-xl
              shadow-lg active:scale-95 transition-all duration-150
              min-h-[56px] flex items-center justify-center
            "
            onClick={() => handleQuickAction('sell')}
          >
            <div className="text-center">
              <div className="text-lg">📉 Sell</div>
              <div className="text-xs opacity-90">${price.toFixed(2)}</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Trade Sheet */}
      <Sheet 
        isOpen={isTradeSheetOpen} 
        onClose={() => setIsTradeSheetOpen(false)}
        title={`${tradeSide === 'buy' ? '📈 Buy' : '📉 Sell'} ${symbol}`}
        snapPoints={[0.6, 0.9]}
        defaultSnap={0}
      >
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleTrade(); }}>
          <div className="space-y-6">
            {/* Order Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={orderType === 'market' ? 'primary' : 'outline'}
                onClick={() => setOrderType('market')}
                className="py-3"
              >
                Market Order
              </Button>
              <Button
                type="button"
                variant={orderType === 'limit' ? 'primary' : 'outline'}
                onClick={() => setOrderType('limit')}
                className="py-3"
              >
                Limit Order
              </Button>
            </div>

            {/* Price Display/Input */}
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {orderType === 'market' ? 'Market Price' : 'Limit Price'}
              </div>
              {orderType === 'market' ? (
                <div className="text-xl font-bold">
                  ${price.toFixed(2)}
                </div>
              ) : (
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full text-xl font-bold bg-transparent outline-none"
                  step="0.01"
                />
              )}
            </Card>

            {/* Amount Input */}
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Amount (USDT)
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-xl font-bold bg-transparent outline-none mb-3"
                step="0.01"
                min="0"
              />
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className="py-2"
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Total</span>
                <span className="font-semibold">
                  ${amount ? (parseFloat(amount) * (orderType === 'market' ? price : parseFloat(limitPrice || '0'))).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Est. Fee (0.1%)</span>
                <span>
                  ${amount ? (parseFloat(amount) * 0.001).toFixed(2) : '0.00'}
                </span>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className={`
                w-full py-4 font-bold text-lg rounded-xl
                ${tradeSide === 'buy' 
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                } text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95 transition-all duration-150
              `}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              {tradeSide === 'buy' ? '📈 Buy' : '📉 Sell'} {symbol}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export default QuickTrade;
