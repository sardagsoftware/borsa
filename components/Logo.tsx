'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  animated = true 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  const traderSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  return (
    <motion.div 
      className={`relative flex items-center ${sizeClasses[size]} ${className}`}
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
    >
      {/* Animated Background Glow */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main Logo Container */}
      <div className="relative flex items-center space-x-1">
        {/* Crypto-Inspired Icon */}
        <motion.div
          className="relative"
          initial={animated ? { rotate: 0 } : {}}
          animate={animated ? { rotate: 360 } : {}}
          transition={animated ? { duration: 20, repeat: Infinity, ease: "linear" } : {}}
        >
          <svg
            width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 56}
            height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 56}
            viewBox="0 0 56 56"
            className="drop-shadow-lg"
          >
            {/* Outer Ring with Crypto Pattern */}
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="url(#gradient1)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={animated ? { rotate: 0 } : {}}
              animate={animated ? { rotate: -360 } : {}}
              transition={animated ? { duration: 15, repeat: Infinity, ease: "linear" } : {}}
            />
            
            {/* Inner Hexagon (Blockchain Pattern) */}
            <motion.path
              d="M 28,8 L 42,18 L 42,38 L 28,48 L 14,38 L 14,18 Z"
              fill="url(#gradient2)"
              stroke="url(#gradient3)"
              strokeWidth="1.5"
              initial={animated ? { scale: 0 } : {}}
              animate={animated ? { scale: 1 } : {}}
              transition={animated ? { delay: 0.3, duration: 0.6 } : {}}
            />
            
            {/* AI Neural Network Pattern */}
            <g opacity="0.8">
              {/* Nodes */}
              <motion.circle cx="28" cy="20" r="2" fill="#F59E0B" 
                initial={animated ? { scale: 0 } : {}}
                animate={animated ? { scale: [0, 1.2, 1] } : {}}
                transition={animated ? { delay: 0.5, duration: 0.4 } : {}}
              />
              <motion.circle cx="20" cy="28" r="2" fill="#F59E0B"
                initial={animated ? { scale: 0 } : {}}
                animate={animated ? { scale: [0, 1.2, 1] } : {}}
                transition={animated ? { delay: 0.6, duration: 0.4 } : {}}
              />
              <motion.circle cx="36" cy="28" r="2" fill="#F59E0B"
                initial={animated ? { scale: 0 } : {}}
                animate={animated ? { scale: [0, 1.2, 1] } : {}}
                transition={animated ? { delay: 0.7, duration: 0.4 } : {}}
              />
              <motion.circle cx="28" cy="36" r="2" fill="#F59E0B"
                initial={animated ? { scale: 0 } : {}}
                animate={animated ? { scale: [0, 1.2, 1] } : {}}
                transition={animated ? { delay: 0.8, duration: 0.4 } : {}}
              />
              
              {/* Connections with Animation */}
              <motion.path
                d="M 28,20 L 20,28 L 28,36 L 36,28 Z"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.6"
                initial={animated ? { pathLength: 0 } : {}}
                animate={animated ? { pathLength: 1 } : {}}
                transition={animated ? { delay: 1, duration: 1.5 } : {}}
              />
            </g>

            {/* Central AI Symbol */}
            <motion.text
              x="28"
              y="32"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="url(#gradient4)"
              className="font-mono"
              initial={animated ? { opacity: 0, y: 5 } : {}}
              animate={animated ? { opacity: 1, y: 0 } : {}}
              transition={animated ? { delay: 1.2, duration: 0.5 } : {}}
            >
              AI
            </motion.text>

            {/* Gradients */}
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.2)" />
                <stop offset="100%" stopColor="rgba(217, 119, 6, 0.1)" />
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Text Logo */}
        <div className="flex flex-col items-start">
          {/* AiLydian Trader */}
          <motion.div
            className={`${textSizes[size]} font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent`}
            initial={animated ? { opacity: 0, x: -20 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={animated ? { delay: 0.8, duration: 0.6 } : {}}
            style={{ fontFamily: '"Orbitron", "Exo 2", sans-serif' }}
          >
            <span className="drop-shadow-sm">AiLydian Trader</span>
          </motion.div>
        </div>
      </div>

      {/* Pulse Effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-lg border border-yellow-500/30"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

// Simplified version without animations for SSR
export const StaticLogo: React.FC<Omit<LogoProps, 'animated'>> = ({ 
  size = 'md', 
  className = '' 
}) => {
  return <Logo size={size} className={className} animated={false} />;
};

export default Logo;
