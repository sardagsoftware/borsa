/**
 * 🏗️ AILYDIAN AppShell - Ultra-Modern Regime-Aware Layout Foundation
 * Enterprise-grade mobile-native shell with psychological color theory
 * Features: Regime detection, performance optimization, accessibility
 * © Emrah Şardağ. All rights reserved.
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { useRegime } from "@/lib/ui/regime";
import { RegimeIndicator } from "@/components/ui/RegimeIndicator";

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  showRegimeIndicator?: boolean;
  variant?: 'default' | 'compact' | 'immersive';
}

export default function AppShell({ 
  header, 
  children, 
  footer, 
  className = "",
  showRegimeIndicator = false,
  variant = 'default'
}: AppShellProps) {
  const [mounted, setMounted] = useState(false);
  const regimeData = useRegime();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton loader for SSR/hydration with regime awareness
  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <div className="h-16 bg-panel animate-pulse border-b border-panel/30" />
        <div className="container mx-auto px-3 py-4">
          <div className="grid gap-4">
            <div className="h-32 bg-panel rounded-2xl animate-pulse" />
            <div className="h-48 bg-panel rounded-2xl animate-pulse" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-24 bg-panel rounded-xl animate-pulse" />
              <div className="h-24 bg-panel rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'container mx-auto px-2 py-2';
      case 'immersive':
        return 'px-0 py-0';
      default:
        return 'container mx-auto px-3 py-4';
    }
  };

  const getRegimeClasses = () => {
    switch (regimeData.regime) {
      case 'bull':
        return 'shadow-green-500/20 border-green-500/10';
      case 'bear': 
        return 'shadow-red-500/20 border-red-500/10';
      case 'volatile':
        return 'shadow-yellow-500/20 border-yellow-500/10';
      case 'sideways':
        return 'shadow-gray-500/10 border-gray-500/5';
      default:
        return 'shadow-soft/10';
    }
  };

  return (
    <div 
      className={`min-h-screen bg-bg text-text antialiased transition-all duration-500 ${getRegimeClasses()} ${className}`}
      data-regime={regimeData.regime}
    >
      {/* Regime indicator - floating top-right */}
      {showRegimeIndicator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed top-4 right-4 z-[60]"
        >
          <RegimeIndicator size="sm" />
        </motion.div>
      )}

      {/* Header with enhanced animations */}
      {header && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1], // Custom easing
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="sticky top-0 z-50 backdrop-blur-md border-b border-panel/20"
          style={{
            background: regimeData.regime === 'bull' ? 'rgba(var(--panel-rgb), 0.85)' :
                       regimeData.regime === 'bear' ? 'rgba(var(--panel-rgb), 0.90)' :
                       'rgba(var(--panel-rgb), 0.95)'
          }}
        >
          {header}
        </motion.header>
      )}

      {/* Main content area with sophisticated transitions */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.1,
          ease: [0.23, 1, 0.32, 1]
        }}
        className={`${getVariantClasses()} pb-safe relative`}
      >
        {/* Background pattern based on regime */}
        <div 
          className={`absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 ${
            regimeData.regime === 'volatile' ? 'bg-warn' : 
            regimeData.regime === 'bull' ? 'bg-accent1' : 
            'bg-brand1'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        />
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.main>

      {/* Footer with smooth entrance */}
      {footer && (
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            ease: "easeOut"
          }}
          className="border-t border-panel/20 bg-panel/50 backdrop-blur-sm"
        >
          {footer}
        </motion.footer>
      )}
    </div>
  );
}

// Page transition wrapper
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}

// Grid system for responsive layouts
interface GridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function Grid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 }, 
  gap = 4,
  className = "" 
}: GridProps) {
  const gridClasses = [
    `grid gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={gridClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3,
        staggerChildren: 0.05
      }}
    >
      {children}
    </motion.div>
  );
}

// Flexible container with max-width constraints
interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Container({ 
  children, 
  size = 'lg',
  className = "" 
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}

// Section component with consistent spacing
interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'centered' | 'split';
}

export function Section({ 
  children, 
  title, 
  subtitle, 
  className = "",
  variant = 'default' 
}: SectionProps) {
  const variantClasses = {
    default: 'text-left',
    centered: 'text-center',
    split: 'lg:flex lg:items-center lg:justify-between lg:text-left text-center'
  };

  return (
    <motion.section
      className={`py-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {(title || subtitle) && (
        <div className={`mb-8 ${variantClasses[variant]}`}>
          {title && (
            <motion.h2 
              className="h2 mb-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p 
              className="subtle text-lg max-w-2xl"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}
      {children}
    </motion.section>
  );
}

// Loading states and skeletons
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-panel border border-white/10 p-6">
      <div className="space-y-4">
        <div className="h-4 bg-panel2 rounded animate-pulse w-3/4" />
        <div className="h-6 bg-panel2 rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-panel2 rounded animate-pulse" />
          <div className="h-3 bg-panel2 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
