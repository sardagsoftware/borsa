/**
 * 🧪 AILYDIAN A/B Theme Smoke Test
 * Simple test page for design tokens and theme switching
 * © Emrah Şardağ. All rights reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SmokeTestPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Initialize theme system
    if (typeof window !== 'undefined') {
      import('@/lib/ui/theme').then(module => {
        (window as any).themeDebug = module.themeDebug;
        module.initializeTheme();
      }).catch(err => {
        console.log('Theme system not available:', err);
      });
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading design tokens...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🎨 AILYDIAN Design System</h1>
            <div className="text-sm text-muted-foreground">A/B Theme Test</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Card */}
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Design Tokens + A/B Testing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bu sayfa otomatik olarak A/B tema testi uygular. Tema değişikliklerini 
            görmek için aşağıdaki butonları kullanın.
          </p>
        </Card>

        {/* Button Tests */}
        <Card className="p-6 space-y-6">
          <h3 className="text-xl font-semibold">🔘 Button Variants</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="buy">Buy Signal</Button>
            <Button variant="sell">Sell Signal</Button>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-muted-foreground">Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🚀</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-muted-foreground">States</h4>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button asChild>
                <a href="#test">Link Button</a>
              </Button>
            </div>
          </div>
        </Card>

        {/* Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Card Example 1</h4>
            <p className="text-sm text-muted-foreground">
              Bu kart design token&apos;ları kullanarak tema değişikliklerine 
              otomatik olarak adapte olur.
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-2">Card Example 2</h4>
            <p className="text-sm text-muted-foreground">
              Calm ve Elevated temaları arasında renk paleti değişiklikleri
              gözlemleyebilirsiniz.
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-2">Card Example 3</h4>
            <p className="text-sm text-muted-foreground">
              Volatilite yüksek olduğunda Shock teması devreye girer.
            </p>
          </Card>
        </div>

        {/* Theme Controls */}
        <Card className="p-6 space-y-6">
          <h3 className="text-xl font-semibold">🎨 A/B Theme Controls</h3>
          
          <p className="text-muted-foreground">
            Browser Console&apos;da tema debug komutları:
          </p>
          
          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
            <div className="text-muted-foreground">{/* Mevcut tema durumu */}</div>
            <div>window.themeDebug?.logCurrentState()</div>
            
            <div className="text-muted-foreground pt-2">{/* Variant A (Calm) zorla */}</div>
            <div>window.themeDebug?.setTestVariant(&apos;A&apos;)</div>
            
            <div className="text-muted-foreground pt-2">{/* Variant B (Elevated) zorla */}</div>
            <div>window.themeDebug?.setTestVariant(&apos;B&apos;)</div>
            
            <div className="text-muted-foreground pt-2">{/* Yüksek volatilite simülasyonu */}</div>
            <div>window.themeDebug?.simulateVolatility(0.9)</div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).themeDebug) {
                  (window as any).themeDebug.setTestVariant('A');
                }
              }}
            >
              🌙 Calm Theme (A)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).themeDebug) {
                  (window as any).themeDebug.setTestVariant('B');
                }
              }}
            >
              ⚡ Elevated Theme (B)
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).themeDebug) {
                  (window as any).themeDebug.simulateVolatility(0.9);
                }
              }}
            >
              🔥 Shock Mode
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).themeDebug) {
                  (window as any).themeDebug.logCurrentState();
                }
              }}
            >
              📊 Debug Info
            </Button>
          </div>
        </Card>

        {/* Design Tokens Info */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">📋 Design Tokens Status</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">✅ Başarıyla Yüklenen</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Core renk paleti (colors.json)</li>
                <li>• Tipografi sistemi (typography.json)</li>
                <li>• Spacing değerleri (spacing.json)</li>
                <li>• Gölge efektleri (shadows.json)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎯 Tema Varyantları</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Calm Theme (Variant A)</li>
                <li>• Elevated Theme (Variant B)</li>
                <li>• Shock Theme (High Volatility)</li>
                <li>• Figma Sync Ready</li>
              </ul>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
