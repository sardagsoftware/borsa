import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, Shield, Lock, Key, AlertTriangle, 
  CheckCircle, Clock, Eye, Download, Upload,
  Plus, Search, Filter, Settings, Copy,
  ExternalLink, RefreshCw
} from 'lucide-react';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  custodyProvider: string;
  walletType: 'hot' | 'cold' | 'multi-sig';
  securityLevel: 'high' | 'medium' | 'low';
  lastActivity: string;
  status: 'active' | 'locked' | 'pending';
}

interface CustodyProvider {
  id: string;
  name: string;
  type: 'institutional' | 'self' | 'third-party';
  status: 'active' | 'maintenance' | 'offline';
  totalAssets: number;
  securityRating: number;
  lastAudit: string;
  features: string[];
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  asset: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'key_rotation' | 'suspicious_activity' | 'backup_created';
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const CustodyDashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [providers, setProviders] = useState<CustodyProvider[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock data
    setAssets([
      {
        id: '1',
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 12.5,
        usdValue: 542500,
        custodyProvider: 'Coinbase Custody',
        walletType: 'cold',
        securityLevel: 'high',
        lastActivity: '2024-01-20T10:30:00Z',
        status: 'active'
      },
      {
        id: '2',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 156.8,
        usdValue: 367840,
        custodyProvider: 'BitGo',
        walletType: 'multi-sig',
        securityLevel: 'high',
        lastActivity: '2024-01-20T09:15:00Z',
        status: 'active'
      },
      {
        id: '3',
        symbol: 'USDT',
        name: 'Tether',
        balance: 50000,
        usdValue: 50000,
        custodyProvider: 'Self-Custody',
        walletType: 'hot',
        securityLevel: 'medium',
        lastActivity: '2024-01-20T11:45:00Z',
        status: 'active'
      }
    ]);

    setProviders([
      {
        id: '1',
        name: 'Coinbase Custody',
        type: 'institutional',
        status: 'active',
        totalAssets: 542500,
        securityRating: 98,
        lastAudit: '2024-01-01',
        features: ['Insurance', 'Multi-Sig', 'Cold Storage', '24/7 Support']
      },
      {
        id: '2',
        name: 'BitGo',
        type: 'institutional',
        status: 'active',
        totalAssets: 367840,
        securityRating: 95,
        lastAudit: '2024-01-15',
        features: ['Multi-Sig', 'Hot Wallet', 'API Access', 'White Glove']
      },
      {
        id: '3',
        name: 'Self-Custody',
        type: 'self',
        status: 'active',
        totalAssets: 50000,
        securityRating: 85,
        lastAudit: '2024-01-10',
        features: ['Full Control', 'Hardware Wallet', 'Multi-Sig Option']
      }
    ]);

    setTransactions([
      {
        id: '1',
        type: 'deposit',
        asset: 'BTC',
        amount: 0.5,
        status: 'completed',
        timestamp: '2024-01-20T10:30:00Z',
        toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        txHash: '0x1234...abcd'
      },
      {
        id: '2',
        type: 'withdrawal',
        asset: 'ETH',
        amount: 5.0,
        status: 'pending',
        timestamp: '2024-01-20T11:00:00Z',
        fromAddress: '0x742d35Cc6634C0532925a3b8D90319',
        toAddress: '0x8ba1f109551bD432803012645Hac136c'
      }
    ]);

    setSecurityEvents([
      {
        id: '1',
        type: 'key_rotation',
        severity: 'medium',
        message: 'Multi-signature keys rotated successfully',
        timestamp: '2024-01-20T08:00:00Z',
        resolved: true
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'high',
        message: 'Unusual login attempt detected from new location',
        timestamp: '2024-01-20T09:30:00Z',
        resolved: false
      }
    ]);
  }, []);

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case 'cold': return 'bg-blue-100 text-blue-800';
      case 'hot': return 'bg-orange-100 text-orange-800';
      case 'multi-sig': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'locked': case 'failed': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0);

  const CustodyOverview = () => (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalPortfolioValue.toLocaleString()}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assets Under Custody</p>
                <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
              </div>
              <Lock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Providers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {providers.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {securityEvents.filter(e => !e.resolved).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.map((asset) => {
                const percentage = (asset.usdValue / totalPortfolioValue) * 100;
                return (
                  <div key={asset.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {asset.symbol}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-600">
                            {asset.balance} {asset.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${asset.usdValue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Multi-Signature Protection</p>
                    <p className="text-sm text-gray-600">Active on 2 of 3 wallets</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Cold Storage</p>
                    <p className="text-sm text-gray-600">87% of assets secured</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Key Rotation</p>
                    <p className="text-sm text-gray-600">Last rotated 5 days ago</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Pending Security Review</p>
                    <p className="text-sm text-orange-700">1 item requires attention</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AssetManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Asset Management</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Asset</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">USD Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Custody Provider</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Wallet Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Security</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {asset.symbol}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-600">{asset.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{asset.balance}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">${asset.usdValue.toLocaleString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{asset.custodyProvider}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getWalletTypeColor(asset.walletType)}`}>
                        {asset.walletType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getSecurityLevelColor(asset.securityLevel)}`}>
                        {asset.securityLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CustodyProviders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custody Providers</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                  {provider.status.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${provider.totalAssets.toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Security Rating</p>
                    <span className="text-sm font-medium text-gray-900">
                      {provider.securityRating}/100
                    </span>
                  </div>
                  <Progress value={provider.securityRating} className="h-2" />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature, index) => (
                      <span key={index} className="inline-flex px-2 py-1 bg-gray-100 text-xs rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Last audit: {new Date(provider.lastAudit).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const TransactionHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'deposit' ? 'bg-green-100 text-green-600' :
                    tx.type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {tx.type === 'deposit' ? <Download className="h-4 w-4" /> :
                     tx.type === 'withdrawal' ? <Upload className="h-4 w-4" /> :
                     <RefreshCw className="h-4 w-4" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-900 capitalize">
                        {tx.type} {tx.amount} {tx.asset}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                    {tx.txHash && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          Hash: {tx.txHash}
                        </p>
                        <Button variant="ghost" size="sm" className="h-4 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-4 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SecurityCenter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Security Center</h3>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Security Scan
        </Button>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div key={event.id} className={`p-4 border rounded-lg ${
                event.severity === 'high' ? 'border-red-200 bg-red-50' :
                event.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      event.severity === 'high' ? 'bg-red-200 text-red-700' :
                      event.severity === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{event.message}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.resolved ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Button variant="outline" size="sm">Resolve</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Security Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { item: 'Two-Factor Authentication', status: 'completed' },
              { item: 'Multi-Signature Wallets', status: 'completed' },
              { item: 'Key Rotation Schedule', status: 'completed' },
              { item: 'Backup Verification', status: 'pending' },
              { item: 'Security Audit', status: 'pending' }
            ].map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {check.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium text-gray-900">{check.item}</span>
                </div>
                {check.status === 'pending' && (
                  <Button variant="outline" size="sm">Configure</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CustodyOverview />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <AssetManagement />
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <CustodyProviders />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustodyDashboard;
