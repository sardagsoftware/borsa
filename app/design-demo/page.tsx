'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { QuickActionsDock } from '@/components/layout/BottomDock';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMetric } from '@/components/ui/card';
import { RegimeIndicator, RegimeDot, RegimeStatusBar } from '@/components/ui/RegimeIndicator';
import { LoadingSpinner, LoadingOverlay, LoadingCard } from '@/components/ui/Loading';
import { Input, Textarea, SearchInput } from '@/components/ui/input';
import { Modal, ConfirmModal, QuickSheet } from '@/components/ui/Modal';
import { RegimeProvider } from '@/lib/ui/regime';
import { motion } from 'framer-motion';

export default function DesignSystemDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock market data for regime testing
  const [mockVolatility, setMockVolatility] = useState(0.02);

  const demoSections = [
    { id: 'regime', title: 'Regime Awareness', description: 'Market psychology-based theming' },
    { id: 'buttons', title: 'Buttons', description: 'Enhanced button system with regime awareness' },
    { id: 'cards', title: 'Cards', description: 'Flexible card components with multiple variants' },
    { id: 'inputs', title: 'Inputs', description: 'Modern form controls with validation' },
    { id: 'modals', title: 'Modals', description: 'Overlay components for complex interactions' },
    { id: 'loading', title: 'Loading States', description: 'Sophisticated loading indicators' },
  ];

  return (
    <RegimeProvider>
      <AppShell
        showRegimeIndicator={true}
        header={
          <div className="bg-panel/90 backdrop-blur-md border-b border-panel/20 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-100">AILYDIAN Design System</h1>
                <p className="text-sm text-gray-400">Ultra-Modern UI Components</p>
              </div>
              <RegimeIndicator />
            </div>
          </div>
        }
        footer={
          <QuickActionsDock
            onBuy={() => console.log('Buy clicked')}
            onSell={() => console.log('Sell clicked')}
            onConnect={() => console.log('Connect clicked')}
            onSettings={() => console.log('Settings clicked')}
          />
        }
      >
        <div className="space-y-12 max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-bold text-gray-100 mb-4">
              Enterprise-Grade Design System
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Regime-aware components with psychological color theory, mobile-native patterns, 
              and ultra-professional animations built for modern trading platforms.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {demoSections.map((section) => (
                <Button
                  key={section.id}
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {section.title}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Regime Testing Section */}
          <motion.section 
            id="regime"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">
                Regime Awareness System
              </h3>
              <p className="text-gray-400">
                Test different market regimes to see psychological color adaptation
              </p>
            </div>

            <Card variant="glass" className="p-6">
              <div className="space-y-6">
                <RegimeStatusBar />
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <RegimeDot className="mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Current Regime</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mock Volatility: {(mockVolatility * 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.1"
                      step="0.005"
                      value={mockVolatility}
                      onChange={(e) => setMockVolatility(parseFloat(e.target.value))}
                      className="w-full h-2 bg-panel rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Calm (0%)</span>
                      <span>Elevated (3%)</span>
                      <span>Shock (7%+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Buttons Section */}
          <motion.section 
            id="buttons"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">Button System</h3>
              <p className="text-gray-400">Regime-aware buttons with enhanced interactions</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>Different styles adapt to current market regime</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="positive">Success</Button>
                  <Button variant="negative">Danger</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="premium">Premium</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button States</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button leftIcon={<span>💎</span>}>With Icon</Button>
                  <Button rightIcon={<span>→</span>}>Right Icon</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button variant="primary" size="icon">⭐</Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Cards Section */}
          <motion.section 
            id="cards"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">Card Components</h3>
              <p className="text-gray-400">Flexible containers with regime-aware styling</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Standard card with subtle regime adaptation</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardMetric 
                    label="BTC/USD"
                    value="$42,150"
                    change="+2.5%"
                    trend="up"
                  />
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="primary">Trade</Button>
                  <Button size="sm" variant="ghost">Details</Button>
                </CardFooter>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                  <CardDescription>Translucent effect with backdrop blur</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardMetric 
                    label="ETH/USD"
                    value="$2,845"
                    change="-1.2%"
                    trend="down"
                  />
                </CardContent>
              </Card>

              <Card variant="interactive">
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Hover effects and click interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardMetric 
                    label="Portfolio"
                    value="$125,430"
                    change="+8.7%"
                    trend="up"
                  />
                </CardContent>
              </Card>

              <Card variant="success">
                <CardHeader>
                  <CardTitle>Success Card</CardTitle>
                  <CardDescription>Positive state with green accents</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="warning">
                <CardHeader>
                  <CardTitle>Warning Card</CardTitle>
                  <CardDescription>Alert state with warning colors</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="premium">
                <CardHeader>
                  <CardTitle>Premium Card</CardTitle>
                  <CardDescription>Gradient design for premium features</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </motion.section>

          {/* Inputs Section */}
          <motion.section 
            id="inputs"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">Input Components</h3>
              <p className="text-gray-400">Modern form controls with validation states</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Input Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    label="Default Input"
                    placeholder="Enter text..."
                    hint="This is a helpful hint"
                  />
                  
                  <Input 
                    variant="outline"
                    label="Outline Input"
                    placeholder="Outline style..."
                  />
                  
                  <Input 
                    variant="filled"
                    label="Filled Input"
                    placeholder="Filled background..."
                  />
                  
                  <Input 
                    variant="glass"
                    label="Glass Input"
                    placeholder="Glass morphism..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Input States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    label="Success State"
                    value="Valid input"
                    success="Input is valid!"
                  />
                  
                  <Input 
                    label="Error State"
                    value="Invalid input"
                    error="This field is required"
                  />
                  
                  <Input 
                    label="Loading State"
                    placeholder="Processing..."
                    loading={true}
                  />
                  
                  <SearchInput
                    label="Search Input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={(query) => console.log('Search:', query)}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Textarea</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  label="Message"
                  placeholder="Enter your message here..."
                  hint="Maximum 500 characters"
                />
              </CardContent>
            </Card>
          </motion.section>

          {/* Modals Section */}
          <motion.section 
            id="modals"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">Modal Components</h3>
              <p className="text-gray-400">Overlay components for complex interactions</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Modal Demos</CardTitle>
                <CardDescription>Click buttons to test different modal types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setModalOpen(true)}>
                    Open Modal
                  </Button>
                  <Button variant="warning" onClick={() => setConfirmOpen(true)}>
                    Confirm Dialog
                  </Button>
                  <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                    Quick Sheet (Mobile)
                  </Button>
                  <Button variant="ghost" onClick={() => setLoadingOverlay(true)}>
                    Loading Overlay
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modal Components */}
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Demo Modal"
              description="This is a demonstration of the modal component"
              size="lg"
            >
              <div className="space-y-4">
                <p className="text-gray-400">
                  This modal demonstrates the regime-aware styling system. 
                  The colors and shadows adapt based on the current market regime.
                </p>
                <div className="p-4 bg-panel/30 rounded-lg">
                  <CardMetric 
                    label="Sample Data"
                    value="$1,234.56"
                    change="+5.2%"
                    trend="up"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </div>
            </Modal>

            <ConfirmModal
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => {
                console.log('Confirmed!');
                setConfirmOpen(false);
              }}
              title="Confirm Action"
              message="Are you sure you want to proceed with this action?"
              variant="warning"
            />

            <QuickSheet
              isOpen={sheetOpen}
              onClose={() => setSheetOpen(false)}
              title="Quick Actions"
            >
              <div className="space-y-4">
                <p className="text-gray-400">
                  This is a mobile-optimized quick sheet for rapid actions.
                </p>
                <div className="grid gap-3">
                  <Button variant="primary">Quick Buy</Button>
                  <Button variant="danger">Quick Sell</Button>
                  <Button variant="secondary">View Details</Button>
                </div>
              </div>
            </QuickSheet>

            <LoadingOverlay
              isVisible={loadingOverlay}
              message="Processing your request..."
              variant="blur"
            />
          </motion.section>

          {/* Loading Section */}
          <motion.section 
            id="loading"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-100 mb-2">Loading States</h3>
              <p className="text-gray-400">Sophisticated loading indicators and skeletons</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spinner Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <LoadingSpinner variant="default" size="sm" />
                    <span className="text-sm text-gray-400">Default</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner variant="dots" />
                    <span className="text-sm text-gray-400">Dots</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner variant="pulse" />
                    <span className="text-sm text-gray-400">Pulse</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner variant="bars" />
                    <span className="text-sm text-gray-400">Bars</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <LoadingSpinner variant="orbit" />
                    <span className="text-sm text-gray-400">Orbit</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading Cards</CardTitle>
                  <CardDescription>Skeleton placeholders</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoadingCard />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setLoadingOverlay(true);
                      setTimeout(() => setLoadingOverlay(false), 3000);
                    }}
                  >
                    Test Loading Overlay
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Footer */}
          <motion.div 
            className="text-center py-12 border-t border-panel/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-semibold text-gray-100 mb-2">
              🚀 AILYDIAN Design System
            </h4>
            <p className="text-gray-400 mb-6">
              Built with Next.js, Tailwind CSS, Framer Motion, and Radix UI
            </p>
            <div className="flex justify-center gap-2">
              <RegimeDot />
              <span className="text-sm text-gray-500">Powered by Regime Intelligence</span>
            </div>
          </motion.div>
        </div>
      </AppShell>
    </RegimeProvider>
  );
}
