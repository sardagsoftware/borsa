/**
 * 🎨 AILYDIAN TRADER - ANIMATED LOGO COMPONENT
 * Professional AI-powered cryptocurrency trading platform branding
 * © 2025 Emrah Şardağ. All rights reserved.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiLydianLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'full' | 'icon' | 'text' | 'minimal';
  animated?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  showGlow?: boolean;
  interactive?: boolean;
  className?: string;
}

export default function AiLydianLogo({
  size = 'md',
  variant = 'full',
  animated = true,
  theme = 'auto',
  showGlow = true,
  interactive = true,
  className = ''
}: AiLydianLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  // Auto-detect theme
  useEffect(() => {
    if (theme === 'auto') {
      const detectTheme = () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
                       document.documentElement.classList.contains('dark');
        setCurrentTheme(isDark ? 'dark' : 'light');
      };
      
      detectTheme();
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', detectTheme);
      
      return () => mediaQuery.removeEventListener('change', detectTheme);
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Size configurations
  const sizeConfig = {
    xs: { container: 'h-6', icon: 'w-6 h-6', text: 'text-xs', spacing: 'gap-1' },
    sm: { container: 'h-8', icon: 'w-8 h-8', text: 'text-sm', spacing: 'gap-1.5' },
    md: { container: 'h-10', icon: 'w-10 h-10', text: 'text-base', spacing: 'gap-2' },
    lg: { container: 'h-12', icon: 'w-12 h-12', text: 'text-lg', spacing: 'gap-2.5' },
    xl: { container: 'h-16', icon: 'w-16 h-16', text: 'text-xl', spacing: 'gap-3' },
    hero: { container: 'h-20', icon: 'w-20 h-20', text: 'text-2xl', spacing: 'gap-4' }
  };

  const config = sizeConfig[size];

  // Color schemes
  const colors = {
    light: {
      primary: '#0066CC',
      secondary: '#00B4D8',
      accent: '#FFD60A',
      text: '#1a1a1a',
      glow: 'rgba(0, 102, 204, 0.3)'
    },
    dark: {
      primary: '#4A9EFF',
      secondary: '#00D4FF',
      accent: '#FFE066',
      text: '#ffffff',
      glow: 'rgba(74, 158, 255, 0.4)'
    }
  };

  const colorScheme = colors[currentTheme];

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    hover: {
      scale: interactive ? 1.05 : 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const iconVariants = {
    initial: { rotate: -180, opacity: 0 },
    animate: { 
      rotate: 0, 
      opacity: 1,
      transition: { duration: 1.2, ease: "easeOut" }
    },
    hover: {
      rotate: 360,
      transition: { duration: 2, ease: "easeInOut" }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }
    }
  };

  const textVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.8, delay: 0.3 }
    }
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: showGlow ? 0.6 : 0, 
      scale: 1,
      transition: { duration: 1.5 }
    },
    pulse: {
      opacity: showGlow ? [0.3, 0.8, 0.3] : 0,
      scale: [0.8, 1.2, 0.8],
      transition: { 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }
    }
  };

  // AI Icon SVG Component
  const AiIcon = () => (
    <motion.svg
      viewBox="0 0 100 100"
      className={`${config.icon} relative z-10`}
      variants={iconVariants}
      animate={animated ? (isHovered ? 'hover' : 'pulse') : 'animate'}
    >
      {/* Outer ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke={colorScheme.primary}
        strokeWidth="2"
        strokeDasharray="10,5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Inner geometric pattern */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* Central core */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill={colorScheme.secondary}
        />
        
        {/* Neural network nodes */}
        {[0, 60, 120, 180, 240, 300].map((angle, index) => {
          const x = 50 + 25 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 25 * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.g key={angle}>
              <motion.circle
                cx={x}
                cy={y}
                r="4"
                fill={colorScheme.accent}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              />
              <motion.line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke={colorScheme.primary}
                strokeWidth="1"
                opacity="0.6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              />
            </motion.g>
          );
        })}
        
        {/* AI text in center */}
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill={currentTheme === 'dark' ? '#000' : '#fff'}
        >
          AI
        </text>
      </motion.g>
      
      {/* Trading chart pattern */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <path
          d="M 20 70 Q 30 60 40 65 T 60 55 T 80 60"
          stroke={colorScheme.accent}
          strokeWidth="2"
          fill="none"
          strokeDasharray="3,2"
        />
      </motion.g>
    </motion.svg>
  );

  // Glow effect
  const GlowEffect = () => (
    <motion.div
      className={`absolute inset-0 rounded-full blur-xl opacity-30 ${config.icon}`}
      style={{ 
        background: `radial-gradient(circle, ${colorScheme.glow} 0%, transparent 70%)` 
      }}
      variants={glowVariants}
      animate={animated ? 'pulse' : 'animate'}
    />
  );

  // Text component
  const LogoText = () => (
    <motion.div
      className={`flex flex-col leading-none ${config.text}`}
      variants={textVariants}
    >
      <motion.span
        className="font-bold tracking-tight"
        style={{ color: colorScheme.text }}
        animate={isHovered && interactive ? { 
          background: `linear-gradient(45deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        } : {}}
        transition={{ duration: 0.3 }}
      >
        AiLydian
      </motion.span>
      <motion.span
        className="font-medium opacity-80 text-xs"
        style={{ color: colorScheme.secondary }}
      >
        TRADER
      </motion.span>
    </motion.div>
  );

  // Render based on variant
  const renderLogo = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className={`relative ${config.icon}`}>
            {showGlow && <GlowEffect />}
            <AiIcon />
          </div>
        );
        
      case 'text':
        return <LogoText />;
        
      case 'minimal':
        return (
          <div className={`flex items-center ${config.spacing}`}>
            <div className={`relative ${config.icon}`}>
              <AiIcon />
            </div>
            <span 
              className={`font-bold ${config.text}`}
              style={{ color: colorScheme.text }}
            >
              AiLydian
            </span>
          </div>
        );
        
      case 'full':
      default:
        return (
          <div className={`flex items-center ${config.spacing}`}>
            <div className={`relative ${config.icon}`}>
              {showGlow && <GlowEffect />}
              <AiIcon />
            </div>
            <LogoText />
          </div>
        );
    }
  };

  return (
    <motion.div
      className={`${config.container} flex items-center select-none ${className}`}
      variants={containerVariants}
      initial={animated ? "initial" : false}
      animate="animate"
      whileHover={interactive ? "hover" : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <AnimatePresence>
        {renderLogo()}
      </AnimatePresence>
      
      {/* Copyright watermark */}
      <motion.div
        className="absolute -bottom-4 left-0 text-[8px] opacity-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 2 }}
        style={{ color: colorScheme.text }}
      >
        © 2025 Emrah Şardağ
      </motion.div>
    </motion.div>
  );
}

// Export additional logo variants
export const AiLydianIcon = (props: Omit<AiLydianLogoProps, 'variant'>) => 
  <AiLydianLogo {...props} variant="icon" />;

export const AiLydianText = (props: Omit<AiLydianLogoProps, 'variant'>) => 
  <AiLydianLogo {...props} variant="text" />;

export const AiLydianMinimal = (props: Omit<AiLydianLogoProps, 'variant'>) => 
  <AiLydianLogo {...props} variant="minimal" />;
