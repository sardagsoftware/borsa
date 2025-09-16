/**
 * 🧪 AILYDIAN Smoke Test Page
 * Test all UI components and design system elements
 * © Emrah Şardağ. All rights reserved.
 */

"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from "react";
import { motion } from "framer-motion";
import AppShell, { 
  Grid, 
  Container, 
  Section 
} from "@/components/layout/AppShell";
import BottomDock, { QuickActionsDock, DockButton } from "@/components/layout/BottomDock";
import { 
  Button, 
  Card,
  CardContent,
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui";
import { Pill, PillsContainer } from "@/components/ui/pills";

export default function SmokeTestPage() {
  const [connected, setConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState("BSC");
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setConnected(!connected);
      setLoading(false);
    }, 2000);
  };

  const variants = ['primary', 'secondary', 'ghost', 'danger', 'success', 'outline'] as const;
  const sizes = ['xs', 'sm', 'default', 'lg', 'xl'] as const;
  const cardVariants = ['default', 'elevated', 'glass', 'flat', 'gradient'] as const;
  const pillVariants = ['default', 'success', 'danger', 'warning'] as const;

  return (
    <div className="min-h-screen bg-bg">
      {/* Smoke Test Title Header */}
      <div className="w-full bg-panel border-b border-panel/30 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AILYDIAN SMOKE TEST
          </h1>
          <p className="text-sm text-slate-400 mt-1">Component Testing Suite</p>
        </div>
      </div>

      <AppShell>
        <Container>
          {/* Hero Section */}
          <Section className="py-12">
            <div className="text-center space-y-6">
              <motion.h1 
                className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-brand1 via-brand2 to-accent1 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                AILYDIAN SMOKE TEST
              </motion.h1>
              <motion.p 
                className="text-xl text-dim max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Testing all UI components and design system elements in the new ULTRA UX/UI + MOBILE-NATIVE design system
              </motion.p>
              
              {/* Status Pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Pill variant="success">🔐 Security System</Pill>
                  <Pill variant="default">🎨 UI Components</Pill>
                  <Pill variant="default">📱 Mobile Native</Pill>
                  <Pill variant="warning">🚀 Docker Ready</Pill>
                </div>
              </div>
              </motion.div>
            </div>
          </Section>

          {/* Button Testing */}
          <Section>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>🔘 Button Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => (
                      <Button 
                        key={variant} 
                        variant={variant}
                        onClick={() => console.log(`${variant} clicked`)}
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sizes</h3>
                  <div className="flex flex-wrap items-end gap-3">
                    {sizes.map((size) => (
                      <Button key={size} size={size} variant="primary">
                        Size {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Special States */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Special States</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="primary" 
                      loading={loading}
                      onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 3000);
                      }}
                    >
                      {loading ? "Processing..." : "Click to Load"}
                    </Button>
                    <Button variant="secondary" disabled>
                      Disabled
                    </Button>
                    <Button 
                      variant="outline" 
                      leftIcon={
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      }
                    >
                      With Icon
                    </Button>
                    <Button variant="primary" className="w-full sm:w-auto">
                      Full Width (Mobile)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Card Testing */}
          <Section>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">🃏 Card Components</h2>
              <Grid cols={{default: 1, md: 2, lg: 3}} gap={6}>
                {cardVariants.map((variant) => (
                  <Card key={variant} variant={variant} interactive>
                    <CardHeader>
                      <CardTitle>Card {variant}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-dim">
                        This is a {variant} card variant showcasing the design system capabilities.
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-dim">Price:</span>
                          <span className="text-sm font-medium text-pos">$43,250.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-dim">Change:</span>
                          <span className="text-sm font-medium text-neg">-2.5%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" variant="ghost" className="w-full">
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
            </div>
          </Section>

          {/* Pills Testing */}
          <Section>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>💊 Pills Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Variants</h3>
                  <PillsContainer>
                    {pillVariants.map((variant) => (
                      <Pill key={variant} variant={variant}>
                        {variant}
                      </Pill>
                    ))}
                  </PillsContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">With Icons & Removable</h3>
                  <PillsContainer>
                    <Pill variant="success">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </Pill>
                    <Pill variant="success">
                      Removable
                    </Pill>
                    <Pill variant="warning">
                      BTC/USDT
                    </Pill>
                    <Pill variant="danger" size="sm">
                      Alert
                    </Pill>
                  </PillsContainer>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Design System Colors */}
          <Section>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>🎨 Design System Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid cols={{default: 2, md: 3, lg: 4}} gap={4}>
                  {[
                    { name: "Brand 1", class: "bg-brand1", text: "text-bg" },
                    { name: "Brand 2", class: "bg-brand2", text: "text-bg" },
                    { name: "Accent 1", class: "bg-accent1", text: "text-bg" },
                    { name: "Accent 2", class: "bg-accent2", text: "text-bg" },
                    { name: "Positive", class: "bg-pos", text: "text-bg" },
                    { name: "Negative", class: "bg-neg", text: "text-white" },
                    { name: "Panel", class: "bg-panel border border-white/10", text: "text-text" },
                    { name: "Panel 2", class: "bg-panel2", text: "text-text" }
                  ].map((color) => (
                    <div 
                      key={color.name}
                      className={`${color.class} ${color.text} p-4 rounded-lg text-center`}
                    >
                      <p className="font-medium">{color.name}</p>
                      <p className="text-xs opacity-75">{color.class}</p>
                    </div>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Section>

          {/* Typography Testing */}
          <Section>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>📝 Typography System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-6xl font-bold">Heading 1</div>
                <div className="text-5xl font-bold">Heading 2</div>
                <div className="text-4xl font-bold">Heading 3</div>
                <div className="text-3xl font-semibold">Heading 4</div>
                <div className="text-2xl font-semibold">Heading 5</div>
                <div className="text-xl font-semibold">Heading 6</div>
                <div className="text-base">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
                <div className="text-sm text-dim">Small text - Secondary information goes here.</div>
                <div className="text-xs text-dim">Extra small text - Fine print and captions.</div>
              </CardContent>
            </Card>
          </Section>

          {/* Spacing for bottom dock */}
          <div className="h-24" />
        </Container>
      </AppShell>

      {/* Bottom Dock */}
      <QuickActionsDock
        onBuy={() => console.log('Buy clicked!')}
        onSell={() => console.log('Sell clicked!')}
        onConnect={handleConnect}
        onSettings={() => console.log('Settings clicked!')}
        connected={connected}
        notifications={5}
      />
    </div>
  );
}
