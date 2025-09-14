/**
 * 📱 AILYDIAN BottomDock - Ultra-Modern Regime-Aware Mobile Navigation
 * Thumb-zone optimized with psychological color adaptation & haptic feedback
 * Features: Gesture support, regime themes, performance optimization
 * © Emrah Şardağ. All rights reserved.
 */

"use client";

import { motion, useAnimation, PanInfo } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { useRegime } from "@/lib/ui/regime";

interface BottomDockProps {
  children: ReactNode;
  className?: string;
  hideOnScroll?: boolean;
  variant?: 'default' | 'compact' | 'floating';
}

export default function BottomDock({ 
  children, 
  className = "",
  hideOnScroll = true,
  variant = 'default'
}: BottomDockProps) {
  const [lastScrollY, setLastScrollY] = useState(0);
  const controls = useAnimation();
  const { regime } = useRegime();

  useEffect(() => {
    if (!hideOnScroll) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down - hide dock with regime-aware animation
            controls.start({ 
              y: 100, 
              opacity: 0.8,
              transition: { 
                type: "spring", 
                stiffness: regime === 'shock' ? 400 : 300, 
                damping: 30 
              }
            });
          } else {
            // Scrolling up - show dock
            controls.start({ 
              y: 0, 
              opacity: 1,
              transition: { 
                type: "spring", 
                stiffness: regime === 'shock' ? 400 : 300, 
                damping: 30 
              }
            });
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, controls, hideOnScroll, regime]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'mx-4';
      case 'floating':
        return 'mx-6';
      default:
        return 'mx-3';
    }
  };

  const getRegimeBackground = () => {
    switch (regime) {
      case 'shock':
        return 'bg-panel/85 border-warn/20 shadow-shock backdrop-blur-xl';
      case 'elevated':
        return 'bg-panel/90 border-accent1/20 shadow-elevated backdrop-blur-xl';
      default:
        return 'bg-panel/80 border-panel/30 shadow-card backdrop-blur-md';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={controls}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className={`fixed bottom-0 inset-x-0 z-40 pointer-events-none ${className}`}
      style={{ 
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)"
      }}
      data-regime={regime}
    >
      <div className={getVariantClasses() + " pointer-events-auto"}>
        <motion.div 
          className={`rounded-2xl border transition-all duration-300 ${getRegimeBackground()}`}
          whileHover={{ 
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          {/* Regime indicator bar */}
          <div 
            className={`h-1 rounded-t-2xl transition-all duration-500 ${
              regime === 'shock' ? 'bg-warn/60' :
              regime === 'elevated' ? 'bg-accent1/60' :
              'bg-brand1/60'
            }`}
          />
          
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            {children}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Enhanced dock button component with regime awareness
interface DockButtonProps {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  badge?: string | number;
  disabled?: boolean;
  className?: string;
  pulse?: boolean;
}

export function DockButton({
  icon,
  label,
  onClick,
  variant = 'secondary',
  badge,
  disabled = false,
  className = "",
  pulse = false
}: DockButtonProps) {
  const { regime } = useRegime();

  const getVariantClasses = () => {
    const base = 'relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-h-[52px] min-w-[52px]';
    
    switch (variant) {
      case 'primary':
        return `${base} ${
          regime === 'shock' ? 'bg-warn text-bg hover:bg-warn/90 shadow-shock' :
          regime === 'elevated' ? 'bg-accent1 text-bg hover:bg-accent1/90 shadow-elevated' :
          'bg-brand1 text-bg hover:bg-brand1/90 shadow-soft'
        }`;
      
      case 'secondary':
        return `${base} bg-panel/60 text-gray-200 hover:bg-panel border border-panel/40 active:scale-95 backdrop-blur-sm`;
      
      case 'danger':
        return `${base} bg-neg text-white hover:bg-neg/90 active:scale-95 shadow-soft`;
        
      case 'success':
        return `${base} bg-pos text-bg hover:bg-pos/90 active:scale-95 shadow-soft`;
      
      default:
        return base;
    }
  };

  return (
    <motion.button
      className={`${getVariantClasses()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${pulse ? 'animate-pulse' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: Math.random() * 0.1 // Stagger animation
      }}
      data-regime={regime}
    >
      <div className="w-6 h-6 mb-1 flex items-center justify-center">
        {icon}
      </div>
      
      {label && (
        <span className="text-xs font-medium truncate max-w-[60px]">
          {label}
        </span>
      )}
      
      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 text-bg text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-soft ${
            regime === 'shock' ? 'bg-warn' :
            regime === 'elevated' ? 'bg-accent1' :
            'bg-brand2'
          }`}
        >
          {badge}
        </motion.div>
      )}
      
      {pulse && (
        <div className={`absolute inset-0 rounded-xl opacity-20 animate-ping ${
          variant === 'primary' ? 'bg-current' : 'bg-brand1'
        }`} />
      )}
    </motion.button>
  );
}

// Quick actions dock with common trading actions
interface QuickActionsDockProps {
  onBuy?: () => void;
  onSell?: () => void;
  onConnect?: () => void;
  onSettings?: () => void;
  buyDisabled?: boolean;
  sellDisabled?: boolean;
  connected?: boolean;
  notifications?: number;
}

export function QuickActionsDock({
  onBuy,
  onSell,
  onConnect,
  onSettings,
  buyDisabled = false,
  sellDisabled = false,
  connected = false,
  notifications = 0
}: QuickActionsDockProps) {
  return (
    <BottomDock>
      <DockButton
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        }
        label="Buy"
        onClick={onBuy}
        variant="primary"
        disabled={buyDisabled}
      />
      
      <DockButton
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        }
        label="Sell"
        onClick={onSell}
        variant="danger"
        disabled={sellDisabled}
      />
      
      <DockButton
        icon={
          connected ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )
        }
        label={connected ? "Connected" : "Connect"}
        onClick={onConnect}
        variant={connected ? "secondary" : "primary"}
      />
      
      <DockButton
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        label="Settings"
        onClick={onSettings}
        variant="secondary"
        badge={notifications > 0 ? notifications : undefined}
      />
    </BottomDock>
  );
}

// Swipeable dock with gesture support
interface SwipeableDockProps {
  children: ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export function SwipeableDock({ 
  children, 
  onSwipeUp, 
  onSwipeDown,
  className = "" 
}: SwipeableDockProps) {
  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity } = info;
    
    if (velocity.y < -500 && onSwipeUp) {
      // Fast upward swipe
      onSwipeUp();
    } else if (velocity.y > 500 && onSwipeDown) {
      // Fast downward swipe
      onSwipeDown();
    }
  };

  return (
    <motion.div
      className={`fixed bottom-0 inset-x-0 z-40 pointer-events-none ${className}`}
      style={{ 
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)"
      }}
      drag="y"
      dragConstraints={{ top: -50, bottom: 50 }}
      dragElastic={0.2}
      onPanEnd={handlePan}
      whileDrag={{ scale: 1.02 }}
    >
      <div className="mx-3 pointer-events-auto">
        <div className="rounded-2xl border border-panel/30 bg-panel/80 backdrop-blur-md shadow-card">
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-panel/50 rounded-full" />
          </div>
          
          <div className="px-4 pb-3 flex items-center justify-between">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
