"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RWADeFiDashboard from './RWADeFiDashboard';
import RiskAnalyticsDashboard from './RiskAnalyticsDashboard';
import NotificationCenter from './NotificationCenter';
import ComplianceDashboard from './ComplianceDashboard';
import CustodyDashboard from './CustodyDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import AccountManagement from './AccountManagement';
import { 
  LayoutDashboard, TrendingUp, Shield, Bell, 
  Settings, User, LogOut, Menu, X, PieChart,
  Wallet, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Mock user data
    setUser({
      id: '1',
      name: 'John Doe',
      email: 'john.doe@ailydian.com',
      role: 'Premium Trader'
    });

    // Mock notification count
    setNotifications(3);
  }, []);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Portfolio Dashboard',
      icon: LayoutDashboard,
      component: RWADeFiDashboard
    },
    {
      id: 'risk',
      label: 'Risk Analytics', 
      icon: Shield,
      component: RiskAnalyticsDashboard
    },
    {
      id: 'compliance',
      label: 'Compliance & AML',
      icon: Settings,
      component: ComplianceDashboard
    },
    {
      id: 'custody',
      label: 'Custody Management',
      icon: Wallet,
      component: CustodyDashboard
    },
    {
      id: 'analytics',
      label: 'Advanced Analytics',
      icon: BarChart3,
      component: AnalyticsDashboard
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: NotificationCenter,
      badge: notifications > 0 ? notifications : undefined
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: User,
      component: AccountManagement
    }
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeTab)?.component || RWADeFiDashboard;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">AILYDIAN</h1>
                <p className="text-sm text-gray-500">Global Trader Pro</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              )}
            </div>
            
            {sidebarOpen && (
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Quick Trade
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Risk Check
                </Button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 hidden sm:block">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <ActiveComponent />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2024 AILYDIAN Global Trader Ultra Pro. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>API Status: Connected</span>
              <span>Last Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
