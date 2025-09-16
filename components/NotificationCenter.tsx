import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, BellOff, Settings, MessageSquare, Mail, 
  Smartphone, Globe, Volume2, VolumeX, Clock,
  CheckCircle, AlertCircle, Info, XCircle
} from 'lucide-react';

interface NotificationPreference {
  channel: 'email' | 'sms' | 'push' | 'websocket';
  enabled: boolean;
  types: {
    trade_execution: boolean;
    risk_alerts: boolean;
    portfolio_updates: boolean;
    system_notifications: boolean;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  channel: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_priority'>('all');

  // Mock WebSocket connection
  useEffect(() => {
    // Simulate WebSocket connection
    const ws = new WebSocket('ws://localhost:8016/ws/user123');
    
    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        const newNotification: Notification = {
          id: data.data.id,
          type: data.data.type,
          title: data.data.title,
          message: data.data.message,
          timestamp: new Date(data.data.timestamp),
          read: false,
          channel: 'websocket',
          priority: data.data.priority || 'medium'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Trade Executed',
        message: 'Successfully bought 100 ETH at $2,450.25',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        channel: 'websocket',
        priority: 'high'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Risk Alert',
        message: 'Portfolio volatility increased to 15.8%',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        channel: 'email',
        priority: 'high'
      },
      {
        id: '3',
        type: 'info',
        title: 'DeFi Yield Update',
        message: 'Aave USDC pool APY increased to 12.5%',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: true,
        channel: 'push',
        priority: 'medium'
      },
      {
        id: '4',
        type: 'error',
        title: 'Transaction Failed',
        message: 'Insufficient gas for transaction 0x1234...5678',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        channel: 'websocket',
        priority: 'critical'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);

    // Mock preferences
    const mockPreferences: NotificationPreference[] = [
      {
        channel: 'email',
        enabled: true,
        types: {
          trade_execution: true,
          risk_alerts: true,
          portfolio_updates: false,
          system_notifications: false
        }
      },
      {
        channel: 'sms',
        enabled: false,
        types: {
          trade_execution: false,
          risk_alerts: true,
          portfolio_updates: false,
          system_notifications: false
        }
      },
      {
        channel: 'push',
        enabled: true,
        types: {
          trade_execution: true,
          risk_alerts: true,
          portfolio_updates: true,
          system_notifications: true
        }
      },
      {
        channel: 'websocket',
        enabled: true,
        types: {
          trade_execution: true,
          risk_alerts: true,
          portfolio_updates: true,
          system_notifications: true
        }
      }
    ];

    setPreferences(mockPreferences);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const updatePreference = useCallback((channel: string, updates: Partial<NotificationPreference>) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.channel === channel 
          ? { ...pref, ...updates }
          : pref
      )
    );
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'websocket': return <Globe className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'high_priority': return ['high', 'critical'].includes(notification.priority);
      default: return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notification Center</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={wsConnected ? 'default' : 'secondary'}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Notifications</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                  >
                    Unread
                  </Button>
                  <Button
                    variant={filter === 'high_priority' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('high_priority')}
                  >
                    High Priority
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-blue-200 shadow-sm'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium truncate ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant={
                              notification.priority === 'critical' ? 'destructive' :
                              notification.priority === 'high' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className={`text-sm mb-2 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {getChannelIcon(notification.channel)}
                          <span>{notification.channel}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>
                            {notification.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            {preferences.map((preference) => (
              <Card key={preference.channel}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getChannelIcon(preference.channel)}
                    {preference.channel.toUpperCase()} Notifications
                    <div className="ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          updatePreference(preference.channel, { 
                            enabled: !preference.enabled 
                          })
                        }
                      >
                        {preference.enabled ? (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-4 w-4 mr-2" />
                            Disabled
                          </>
                        )}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(preference.types).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-500">
                            {type === 'trade_execution' && 'Get notified when trades are executed'}
                            {type === 'risk_alerts' && 'Receive alerts for risk threshold breaches'}
                            {type === 'portfolio_updates' && 'Updates on portfolio performance changes'}
                            {type === 'system_notifications' && 'System maintenance and updates'}
                          </div>
                        </div>
                        <Button
                          variant={enabled ? 'default' : 'outline'}
                          size="sm"
                          disabled={!preference.enabled}
                          onClick={() => 
                            updatePreference(preference.channel, {
                              types: {
                                ...preference.types,
                                [type]: !enabled
                              }
                            })
                          }
                        >
                          {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Quiet Hours</div>
                    <div className="text-sm text-gray-500">
                      Disable non-critical notifications during specified hours
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="time" 
                      defaultValue="22:00"
                      className="w-24"
                    />
                    <span className="py-2">to</span>
                    <Input 
                      type="time" 
                      defaultValue="08:00"
                      className="w-24"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Digest Mode</div>
                    <div className="text-sm text-gray-500">
                      Group similar notifications into daily digest
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sound Alerts</div>
                    <div className="text-sm text-gray-500">
                      Play sound for high-priority notifications
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Sound
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
