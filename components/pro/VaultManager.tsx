'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExchangeCredential {
  id: string;
  exchange: string;
  label: string;
  apiKey: string;
  secretKey: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

interface VaultManagerProps {
  credentials?: ExchangeCredential[];
  onAddCredential?: (credential: Omit<ExchangeCredential, 'id' | 'createdAt'>) => void;
  onEditCredential?: (id: string, credential: Partial<ExchangeCredential>) => void;
  onDeleteCredential?: (id: string) => void;
  onTestCredential?: (id: string) => Promise<boolean>;
  onToggleActive?: (id: string, active: boolean) => void;
}

const SUPPORTED_EXCHANGES = [
  { value: 'binance', label: 'Binance', icon: '🟡' },
  { value: 'coinbase', label: 'Coinbase Pro', icon: '🔵' },
  { value: 'kraken', label: 'Kraken', icon: '🟣' },
  { value: 'kucoin', label: 'KuCoin', icon: '🟢' },
  { value: 'bybit', label: 'Bybit', icon: '🟠' },
  { value: 'okx', label: 'OKX', icon: '⚫' }
];

export function VaultManager({ 
  credentials = [], 
  onAddCredential,
  onEditCredential,
  onDeleteCredential,
  onTestCredential,
  onToggleActive
}: VaultManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCredential, setNewCredential] = useState({
    exchange: '',
    label: '',
    apiKey: '',
    secretKey: '',
    isActive: true
  });
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [testingCredentials, setTestingCredentials] = useState<Set<string>>(new Set());

  const mockCredentials: ExchangeCredential[] = [
    {
      id: '1',
      exchange: 'binance',
      label: 'Main Trading Account',
      apiKey: 'ak_1234567890abcdef',
      secretKey: '***encrypted***',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date()
    },
    {
      id: '2',
      exchange: 'coinbase',
      label: 'DCA Account',
      apiKey: 'cb_0987654321fedcba',
      secretKey: '***encrypted***',
      isActive: true,
      createdAt: new Date('2024-01-20'),
      lastUsed: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: '3',
      exchange: 'kraken',
      label: 'Backup Account',
      apiKey: 'kr_abcdef1234567890',
      secretKey: '***encrypted***',
      isActive: false,
      createdAt: new Date('2024-02-01')
    }
  ];

  const currentCredentials = credentials.length > 0 ? credentials : mockCredentials;

  const handleAddCredential = () => {
    if (newCredential.exchange && newCredential.label && newCredential.apiKey && newCredential.secretKey) {
      onAddCredential?.(newCredential);
      setNewCredential({
        exchange: '',
        label: '',
        apiKey: '',
        secretKey: '',
        isActive: true
      });
      setIsAddingNew(false);
    }
  };

  const toggleSecretVisibility = (credentialId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(credentialId)) {
      newVisible.delete(credentialId);
    } else {
      newVisible.add(credentialId);
    }
    setVisibleSecrets(newVisible);
  };

  const handleTestCredential = async (credentialId: string) => {
    setTestingCredentials(prev => new Set([...prev, credentialId]));
    try {
      const result = await onTestCredential?.(credentialId);
      // Show result feedback
      console.log(`Credential test ${result ? 'passed' : 'failed'}`);
    } finally {
      setTestingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(credentialId);
        return newSet;
      });
    }
  };

  const getExchangeInfo = (exchange: string) => {
    return SUPPORTED_EXCHANGES.find(ex => ex.value === exchange) || 
           { value: exchange, label: exchange, icon: '🔑' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vault Manager</h1>
            <p className="text-gray-600">Secure storage for exchange API credentials</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsAddingNew(true)}
          className="flex items-center space-x-2"
          disabled={isAddingNew}
        >
          <Plus className="h-4 w-4" />
          <span>Add Credential</span>
        </Button>
      </div>

      {/* Security Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <div className="font-semibold text-gray-900">Vault Secured</div>
                <div className="text-sm text-gray-600">
                  AES-256-CBC encryption active • {currentCredentials.length} credentials stored
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>Encrypted at rest</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Credential Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Add New Exchange Credential</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <select
                  id="exchange"
                  value={newCredential.exchange}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, exchange: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Exchange</option>
                  {SUPPORTED_EXCHANGES.map(exchange => (
                    <option key={exchange.value} value={exchange.value}>
                      {exchange.icon} {exchange.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Main Trading Account"
                  value={newCredential.label}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Enter your API key"
                value={newCredential.apiKey}
                onChange={(e) => setNewCredential(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Enter your secret key"
                value={newCredential.secretKey}
                onChange={(e) => setNewCredential(prev => ({ ...prev, secretKey: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCredential}>
                Add Credential
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credentials List */}
      <Card>
        <CardHeader>
          <CardTitle>Stored Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentCredentials.map(credential => {
              const exchangeInfo = getExchangeInfo(credential.exchange);
              const isSecretVisible = visibleSecrets.has(credential.id);
              const isTesting = testingCredentials.has(credential.id);
              
              return (
                <div 
                  key={credential.id}
                  className={cn(
                    "border rounded-lg p-4",
                    credential.isActive ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{exchangeInfo.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{credential.label}</h3>
                          {credential.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{exchangeInfo.label}</div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs text-gray-500 w-16">API Key:</Label>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {credential.apiKey}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(credential.apiKey)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs text-gray-500 w-16">Secret:</Label>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {isSecretVisible ? credential.secretKey : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSecretVisibility(credential.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isSecretVisible ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Added: {credential.createdAt.toLocaleDateString()}</span>
                          {credential.lastUsed && (
                            <span>Last used: {credential.lastUsed.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestCredential(credential.id)}
                        disabled={isTesting}
                        className="flex items-center space-x-1"
                      >
                        {isTesting ? (
                          <>
                            <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full" />
                            <span>Testing</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Test</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleActive?.(credential.id, !credential.isActive)}
                      >
                        {credential.isActive ? (
                          <Unlock className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteCredential?.(credential.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentCredentials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No credentials stored yet</p>
                <p className="text-sm">Add your first exchange credential to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Security Notice</p>
              <p>
                All API credentials are encrypted using AES-256-CBC encryption and stored securely. 
                Never share your credentials with anyone. Use read-only API keys when possible for trading bots.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
