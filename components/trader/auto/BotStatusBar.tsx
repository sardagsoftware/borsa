'use client';

import React from 'react';

interface BotStatusBarProps {
  mode: 'semi' | 'auto' | 'off';
  killSwitch: boolean;
  optIn: boolean;
  onModeChange: (mode: 'semi' | 'auto' | 'off') => void;
  onKillSwitch: (activated: boolean) => void;
  onOptInToggle: (enabled: boolean) => void;
}

export default function BotStatusBar({
  mode,
  killSwitch,
  optIn,
  onModeChange,
  onKillSwitch,
  onOptInToggle
}: BotStatusBarProps) {
  
  const getModeColor = (currentMode: string) => {
    switch (currentMode) {
      case 'auto':
        return 'bg-[#0ECB81] text-black';
      case 'semi':
        return 'bg-[#F0B90B] text-black';
      case 'off':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg p-4">
      <div className="flex items-center justify-between">
        
        {/* Left Side - Mode Controls */}
        <div className="flex items-center gap-6">
          
          {/* Bot Mode Selector */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-medium">Mode:</span>
            <div className="flex bg-[#2B3139] rounded-lg p-1">
              {(['off', 'semi', 'auto'] as const).map((modeOption) => (
                <button
                  key={modeOption}
                  onClick={() => onModeChange(modeOption)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    mode === modeOption
                      ? getModeColor(modeOption)
                      : 'text-gray-400 hover:text-white hover:bg-[#3B4049]'
                  }`}
                >
                  {modeOption.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Live Trading Opt-in */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-medium">Live Trading:</span>
            <button
              onClick={() => onOptInToggle(!optIn)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                optIn
                  ? 'bg-[#0ECB81] text-black hover:bg-[#0CAD6F]'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${optIn ? 'bg-black' : 'bg-gray-300'}`}></div>
              {optIn ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Paper Trading Indicator */}
          {!optIn && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-900 text-blue-200 rounded-lg text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              PAPER MODE
            </div>
          )}
        </div>

        {/* Right Side - Emergency Controls */}
        <div className="flex items-center gap-4">
          
          {/* Daily P&L */}
          <div className="text-right">
            <div className="text-sm text-gray-400">Daily P&L</div>
            <div className="text-lg font-bold text-[#0ECB81]">+$127.45</div>
          </div>

          {/* Guard Status */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#0ECB81] rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Guards Active</span>
          </div>

          {/* Kill Switch */}
          <button
            onClick={() => onKillSwitch(!killSwitch)}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
              killSwitch
                ? 'bg-[#F6465D] text-white hover:bg-[#E4343E] animate-pulse'
                : 'bg-[#2B3139] text-gray-400 hover:bg-[#3B4049] border-2 border-[#F6465D]'
            }`}
          >
            {killSwitch ? '🛑 KILLED' : 'KILL SWITCH'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-4 flex items-center justify-between text-sm">
        
        <div className="flex items-center gap-6">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              killSwitch ? 'bg-[#F6465D]' : 
              mode === 'auto' ? 'bg-[#0ECB81]' : 
              mode === 'semi' ? 'bg-[#F0B90B]' : 'bg-gray-500'
            }`}></div>
            <span className="text-gray-400">
              {killSwitch ? 'All operations stopped' :
               mode === 'auto' ? 'Fully autonomous trading' :
               mode === 'semi' ? 'Semi-autonomous (approval required)' :
               'Manual trading only'}
            </span>
          </div>

          {/* Risk Limits */}
          <div className="text-gray-500">
            Max Daily Loss: $600 • Max Positions: 5 • Max Single Risk: 0.8%
          </div>
        </div>

        {/* Performance Stats */}
        <div className="text-gray-500">
          Signals: 1,247 • Decisions: 89 • Orders: 67 • Success Rate: 73.4%
        </div>
      </div>
    </div>
  );
}
