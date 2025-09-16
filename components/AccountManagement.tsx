import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, Settings, Bell, Shield as Security, CreditCard, 
  Smartphone, Mail, Lock, Key, Shield,
  Globe, Moon, Sun, Volume2, VolumeX,
  Download, Upload, RefreshCw, Eye, Edit3,
  CheckCircle, AlertTriangle, X
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  avatar?: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

interface NotificationPreference {
  type: string;
  label: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created: string;
  lastUsed: string;
  status: 'active' | 'expired' | 'revoked';
}

const AccountManagement: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Mock data
    setUser({
      id: '1',
      name: 'John Doe',
      email: 'john.doe@ailydian.com',
      phone: '+1 (555) 123-4567',
      country: 'United States',
      timezone: 'America/New_York',
      kycStatus: 'approved',
      twoFactorEnabled: true,
      emailVerified: true,
      phoneVerified: true
    });

    setSecuritySettings([
      {
        id: '1',
        name: 'Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        enabled: true,
        required: true
      },
      {
        id: '2',
        name: 'Login Notifications',
        description: 'Get notified when someone logs into your account',
        enabled: true,
        required: false
      },
      {
        id: '3',
        name: 'API Access Logging',
        description: 'Log all API access to your account',
        enabled: true,
        required: false
      },
      {
        id: '4',
        name: 'Device Management',
        description: 'Manage and monitor devices that access your account',
        enabled: false,
        required: false
      }
    ]);

    setNotifications([
      {
        type: 'trade_execution',
        label: 'Trade Executions',
        email: true,
        sms: false,
        push: true,
        inApp: true
      },
      {
        type: 'portfolio_alerts',
        label: 'Portfolio Alerts',
        email: true,
        sms: true,
        push: true,
        inApp: true
      },
      {
        type: 'security_alerts',
        label: 'Security Alerts',
        email: true,
        sms: true,
        push: true,
        inApp: true
      },
      {
        type: 'market_updates',
        label: 'Market Updates',
        email: false,
        sms: false,
        push: true,
        inApp: true
      },
      {
        type: 'system_maintenance',
        label: 'System Maintenance',
        email: true,
        sms: false,
        push: false,
        inApp: true
      }
    ]);

    setApiKeys([
      {
        id: '1',
        name: 'Trading Bot API',
        key: 'ak_live_1234567890abcdef...',
        permissions: ['trade', 'read_portfolio', 'read_positions'],
        created: '2024-01-15',
        lastUsed: '2024-01-20T10:30:00Z',
        status: 'active'
      },
      {
        id: '2',
        name: 'Portfolio Analytics',
        key: 'ak_live_abcdef1234567890...',
        permissions: ['read_portfolio', 'read_analytics'],
        created: '2024-01-10',
        lastUsed: '2024-01-19T15:45:00Z',
        status: 'active'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': case 'expired': case 'revoked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'rejected': case 'expired': case 'revoked': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const ProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profile Information</h3>
        <Button variant="outline">
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={user?.name || ''} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  readOnly
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    readOnly
                  />
                  {user?.emailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Button size="sm">Verify</Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="tel" 
                    value={user?.phone || ''} 
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    readOnly
                  />
                  {user?.phoneVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Button size="sm">Verify</Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Country
                </label>
                <select 
                  value={user?.country || ''} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Timezone
                </label>
                <select 
                  value={user?.timezone || ''} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  KYC Status
                </label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.kycStatus || 'pending')}`}>
                    {getStatusIcon(user?.kycStatus || 'pending')}
                    {user?.kycStatus?.toUpperCase()}
                  </span>
                  {user?.kycStatus !== 'approved' && (
                    <Button size="sm" variant="outline">Complete KYC</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Security Settings</h3>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-green-600">95/100</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={95} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-sm font-bold text-gray-900">2 hours ago</p>
                <p className="text-xs text-gray-600">New York, US</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securitySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${setting.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{setting.name}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                    {setting.required && (
                      <span className="text-xs text-orange-600 font-medium">Required</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setting.enabled}
                      disabled={setting.required}
                      className="sr-only peer"
                      onChange={(e) => {
                        if (!setting.required) {
                          setSecuritySettings(prev => 
                            prev.map(s => 
                              s.id === setting.id 
                                ? { ...s, enabled: e.target.checked }
                                : s
                            )
                          );
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {setting.name === 'Two-Factor Authentication' && (
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Current Password
              </label>
              <input 
                type="password" 
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                New Password
              </label>
              <input 
                type="password" 
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Confirm New Password
              </label>
              <input 
                type="password" 
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Confirm new password"
              />
            </div>
            <Button>Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Notification Type</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">SMS</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Push</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">In-App</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.type} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{notification.label}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={notification.email}
                        onChange={(e) => {
                          setNotifications(prev => 
                            prev.map(n => 
                              n.type === notification.type 
                                ? { ...n, email: e.target.checked }
                                : n
                            )
                          );
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={notification.sms}
                        onChange={(e) => {
                          setNotifications(prev => 
                            prev.map(n => 
                              n.type === notification.type 
                                ? { ...n, sms: e.target.checked }
                                : n
                            )
                          );
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={notification.push}
                        onChange={(e) => {
                          setNotifications(prev => 
                            prev.map(n => 
                              n.type === notification.type 
                                ? { ...n, push: e.target.checked }
                                : n
                            )
                          );
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={notification.inApp}
                        onChange={(e) => {
                          setNotifications(prev => 
                            prev.map(n => 
                              n.type === notification.type 
                                ? { ...n, inApp: e.target.checked }
                                : n
                            )
                          );
                        }}
                        className="rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Button>Save Notification Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const APIManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Key Management</h3>
        <Button>
          <Key className="h-4 w-4 mr-2" />
          Generate New API Key
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                    <p className="text-sm text-gray-600">Created: {new Date(apiKey.created).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apiKey.status)}`}>
                    {getStatusIcon(apiKey.status)}
                    {apiKey.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-700">API Key:</p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{apiKey.key}</code>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permission) => (
                      <span key={permission} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last used: {new Date(apiKey.lastUsed).toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                      <X className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PreferencesSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Preferences</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Settings }
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-lg ${
                        theme === themeOption.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <themeOption.icon className="h-5 w-5" />
                      <span className="text-sm">{themeOption.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Language
                </label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Currency Display
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="btc">BTC (₿)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Default Order Type
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                  <option value="stop">Stop Order</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Risk Tolerance
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Confirmation Dialogs</p>
                  <p className="text-xs text-gray-600">Show confirmation for all trades</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sound Notifications</p>
                  <p className="text-xs text-gray-600">Play sound for important events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Preferences</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APIManagement />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountManagement;
