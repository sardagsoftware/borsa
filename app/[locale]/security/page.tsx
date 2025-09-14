'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Shield, Lock, AlertTriangle, Eye, Settings } from 'lucide-react';

export default function SecurityPage() {
  const [killSwitch, setKillSwitch] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [liveTradingEnabled, setLiveTradingEnabled] = useState(false);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(true);

  const handleKillSwitch = () => {
    setKillSwitch(!killSwitch);
    // Call security service
    fetch('/api/security/kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !killSwitch, reason: 'User activated' }),
    });
  };

  const securityEvents = [
    {
      type: 'login',
      user: 'admin@ailydian.com',
      timestamp: '2025-09-13 14:30:25',
      ip: '192.168.1.100',
      severity: 'low',
    },
    {
      type: 'trade',
      user: 'trader@ailydian.com',
      timestamp: '2025-09-13 14:25:10',
      ip: '192.168.1.101',
      severity: 'medium',
      details: 'Large position opened: BTCUSDT $5000',
    },
    {
      type: 'security_violation',
      user: 'unknown',
      timestamp: '2025-09-13 14:20:33',
      ip: '10.0.0.1',
      severity: 'high',
      details: 'Failed login attempt from unrecognized IP',
    },
  ];

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-binance-yellow">🔒 Security & Compliance</h1>
        
        {/* Emergency Kill Switch */}
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${killSwitch ? 'text-binance-red' : 'text-gray-400'}`}>
            Kill Switch: {killSwitch ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <Button
            variant={killSwitch ? 'negative' : 'outline'}
            size="lg"
            onClick={handleKillSwitch}
            className="text-lg font-bold"
          >
            🛑 {killSwitch ? 'DEACTIVATE' : 'EMERGENCY STOP'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Security Settings */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="text-binance-yellow" size={24} />
            <h2 className="text-xl font-bold">Security Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-400">Extra security for high-value trades</p>
              </div>
              <Switch 
                checked={twoFactorEnabled} 
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Live Trading</h4>
                <p className="text-sm text-gray-400">Allow real money trading (high risk)</p>
              </div>
              <Switch 
                checked={liveTradingEnabled} 
                onCheckedChange={setLiveTradingEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">IP Whitelist</h4>
                <p className="text-sm text-gray-400">Restrict access to known IPs</p>
              </div>
              <Switch 
                checked={ipWhitelistEnabled} 
                onCheckedChange={setIpWhitelistEnabled}
              />
            </div>
            
            <div className="pt-4 border-t border-gray-600">
              <h4 className="font-bold mb-2">Risk Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Max Daily Loss ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2 mt-1"
                    defaultValue="500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Max Single Trade (%)</label>
                  <input 
                    type="number" 
                    className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2 mt-1"
                    defaultValue="1.0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Eye className="text-binance-green" size={24} />
            <h2 className="text-xl font-bold">Compliance Status</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>KYC Verification:</span>
              <span className="text-binance-green font-bold">✓ VERIFIED</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AML Status:</span>
              <span className="text-binance-green font-bold">✓ CLEAN</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Regional Compliance:</span>
              <span className="text-binance-green font-bold">✓ US COMPLIANT</span>
            </div>
            <div className="flex items-center justify-between">
              <span>API Keys Encrypted:</span>
              <span className="text-binance-green font-bold">✓ AES-256</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Session Security:</span>
              <span className="text-binance-green font-bold">✓ JWT TOKENS</span>
            </div>
            
            <div className="pt-4 border-t border-gray-600">
              <h4 className="font-bold mb-2">Trading Limits</h4>
              <div className="text-sm space-y-1">
                <div>Daily Limit: <span className="text-binance-yellow">$2,500 / $10,000</span></div>
                <div>Monthly Limit: <span className="text-binance-yellow">$50,000 / $100,000</span></div>
                <div>Max Leverage: <span className="text-binance-yellow">20x</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events Log */}
      <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-binance-red" size={24} />
            <h2 className="text-xl font-bold">Security Events</h2>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings size={16} className="mr-2" />
                View All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-bold mb-4">All Security Events</h3>
              <div className="max-h-96 overflow-y-auto">
                {securityEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          event.severity === 'high' ? 'bg-binance-red' :
                          event.severity === 'medium' ? 'bg-binance-yellow text-black' :
                          'bg-gray-600'
                        }`}>
                          {event.type.toUpperCase()}
                        </span>
                        <div className="mt-2 text-sm">
                          <div>User: {event.user}</div>
                          <div>IP: {event.ip}</div>
                          {event.details && <div>Details: {event.details}</div>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{event.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          {securityEvents.slice(0, 5).map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <div className="flex items-center space-x-3">
                <span className={`w-3 h-3 rounded-full ${
                  event.severity === 'high' ? 'bg-binance-red' :
                  event.severity === 'medium' ? 'bg-binance-yellow' :
                  'bg-binance-green'
                }`}></span>
                <div>
                  <div className="font-bold">{event.type.toUpperCase()}</div>
                  <div className="text-sm text-gray-400">{event.user} from {event.ip}</div>
                </div>
              </div>
              <span className="text-sm text-gray-400">{event.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
