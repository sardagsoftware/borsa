/**
 * 🎯 AILYDIAN Header - Responsive Navigation & Wallet Integration
 * Mobile-first header with regime-aware theming
 * © Emrah Şardağ. All rights reserved.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Logo from "@/components/Logo";
import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';

interface HeaderProps {
  className?: string;
  connected?: boolean;
  walletAddress?: string;
  currentNetwork?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNetworkChange?: (network: string) => void;
  notifications?: number;
}

export default function Header({
  className = "",
  connected = false,
  walletAddress,
  currentNetwork = "BSC",
  onConnect,
  onDisconnect,
  onNetworkChange,
  notifications = 0
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [networkMenuOpen, setNetworkMenuOpen] = useState(false);

  const networks = [
    { id: "BSC", name: "Binance Smart Chain", icon: "🟡" },
    { id: "ETH", name: "Ethereum", icon: "⚪" },
    { id: "POLYGON", name: "Polygon", icon: "🟣" },
    { id: "ARBITRUM", name: "Arbitrum", icon: "🔵" }
  ];

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setMobileMenuOpen(false);
      setProfileMenuOpen(false);
      setNetworkMenuOpen(false);
    };

    if (mobileMenuOpen || profileMenuOpen || networkMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [mobileMenuOpen, profileMenuOpen, networkMenuOpen]);

  return (
    <header className={`sticky top-0 z-50 border-b border-panel/30 bg-bg/80 backdrop-blur-md ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo & Brand */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo size="md" className="text-brand1" />
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/trading" label="Trading" />
            <NavLink href="/portfolio" label="Portfolio" />
            <NavLink href="/quantum/portfolio" label="Quantum" />
            <NavLink href="/social/sentiment" label="Sentiment" />
            <NavLink href="/trading/auto-trader" label="Auto-Trader" />
            <NavLink href="/monitoring" label="Monitoring" />
            <NavLink href="/settings" label="Settings" badge={notifications} />
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Network Selector */}
            <div className="relative">
              <motion.button
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl bg-panel border border-panel/30 hover:bg-panel/80 transition-colors shadow-soft"
                onClick={(e) => {
                  e.stopPropagation();
                  setNetworkMenuOpen(!networkMenuOpen);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm">
                  {networks.find(n => n.id === currentNetwork)?.icon}
                </span>
                <span className="text-sm font-medium">
                  {currentNetwork}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {networkMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 w-48 bg-panel border border-panel/30 rounded-2xl shadow-card overflow-hidden backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {networks.map((network) => (
                      <motion.button
                        key={network.id}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-panel/50 transition-colors rounded-xl ${
                          currentNetwork === network.id ? "bg-panel/50" : ""
                        }`}
                        onClick={() => {
                          onNetworkChange?.(network.id);
                          setNetworkMenuOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                      >
                        <span>{network.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{network.name}</p>
                          <p className="text-xs text-dim">{network.id}</p>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wallet Connection */}
            {connected ? (
              <div className="relative">
                <motion.button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-pos/10 border border-pos/20 text-pos hover:bg-pos/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileMenuOpen(!profileMenuOpen);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-6 h-6 rounded-full bg-pos flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {formatAddress(walletAddress)}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 w-56 bg-panel border border-white/10 rounded-xl shadow-card-lg overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-white/10">
                        <p className="text-sm font-medium">Connected Wallet</p>
                        <p className="text-xs text-dim font-mono">{walletAddress}</p>
                      </div>
                      <div className="p-2">
                        <ProfileMenuItem icon="👤" label="Profile" onClick={() => {}} />
                        <ProfileMenuItem icon="📊" label="Portfolio" onClick={() => {}} />
                        <ProfileMenuItem icon="⚙️" label="Settings" onClick={() => {}} />
                        <div className="h-px bg-white/10 my-2" />
                        <ProfileMenuItem 
                          icon="🚪" 
                          label="Disconnect" 
                          onClick={() => {
                            onDisconnect?.();
                            setProfileMenuOpen(false);
                          }}
                          danger 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="default"
                onClick={onConnect}
                className="hidden sm:flex"
              >
                Connect Wallet
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              className="lg:hidden p-2 rounded-lg bg-panel2 border border-white/10 hover:bg-soft transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.svg
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 py-4"
            >
              <nav className="space-y-2">
                <MobileNavLink href="/dashboard" label="Dashboard" />
                <MobileNavLink href="/trading" label="Trading" />
                <MobileNavLink href="/portfolio" label="Portfolio" />
                <MobileNavLink href="/quantum/portfolio" label="Quantum" />
                <MobileNavLink href="/social/sentiment" label="Sentiment" />
                <MobileNavLink href="/trading/auto-trader" label="Auto-Trader" />
                <MobileNavLink href="/monitoring" label="Monitoring" />
                <MobileNavLink href="/settings" label="Settings" badge={notifications} />
              </nav>
              
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                {/* Mobile Network Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dim">Network:</span>
                  <select 
                    value={currentNetwork}
                    onChange={(e) => onNetworkChange?.(e.target.value)}
                    className="bg-panel2 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  >
                    {networks.map(network => (
                      <option key={network.id} value={network.id}>
                        {network.icon} {network.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Wallet Connection */}
                {!connected && (
                  <Button 
                    variant="primary" 
                    size="default" 
                    className="w-full"
                    onClick={onConnect}
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// Navigation Link Components
interface NavLinkProps {
  href: string;
  label: string;
  badge?: number;
}

function NavLink({ href, label, badge }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link href={href}>
      <motion.span
        className={`relative transition-colors font-medium cursor-pointer ${
          isActive ? 'text-brand1' : 'text-text hover:text-brand1'
        }`}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
      >
        {label}
        {badge && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-accent1 text-bg text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
          >
            {badge}
          </motion.span>
        )}
      </motion.span>
    </Link>
  );
}

function MobileNavLink({ href, label, badge }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link href={href}>
      <motion.span
        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${
          isActive ? 'bg-soft text-brand1' : 'hover:bg-soft'
        }`}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="font-medium">{label}</span>
        {badge && badge > 0 && (
          <span className="bg-accent1 text-bg text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </motion.span>
    </Link>
  );
}

interface ProfileMenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ProfileMenuItem({ icon, label, onClick, danger = false }: ProfileMenuItemProps) {
  return (
    <motion.button
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
        danger ? "hover:bg-neg/10 text-neg" : "hover:bg-soft"
      }`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
