'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function Logo({ size = 'md', animated = true, className = '' }: LogoProps) {
  const sizes = {
    sm: 'w-56 h-16',
    md: 'w-72 h-24',
    lg: 'w-96 h-28'
  };

  const glowVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`relative ${sizes[size]}`}>
        {/* Glow effect */}
        {animated && (
          <motion.div
            variants={glowVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl rounded-full"
          />
        )}

        {/* Main logo */}
        <svg
          viewBox="0 0 200 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Background gradient */}
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Trading chart pattern */}
          <g>
            {/* Trading chart line */}
            <path
              d="M20 50 L35 35 L50 40 L65 25 L80 30 L95 15"
              stroke="url(#logo-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Decorative dots */}
            {animated ? (
              <>
                <motion.circle
                  cx="35"
                  cy="35"
                  r="3"
                  fill="#10b981"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.circle
                  cx="65"
                  cy="25"
                  r="3"
                  fill="#06b6d4"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
                <motion.circle
                  cx="95"
                  cy="15"
                  r="3"
                  fill="#10b981"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                />
              </>
            ) : (
              <>
                <circle cx="35" cy="35" r="3" fill="#10b981" />
                <circle cx="65" cy="25" r="3" fill="#06b6d4" />
                <circle cx="95" cy="15" r="3" fill="#10b981" />
              </>
            )}

            {/* Text */}
            <text
              x="110"
              y="35"
              fill="#f1f5f9"
              fontSize="20"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              LyDian
            </text>
            <text
              x="110"
              y="55"
              fill="#94a3b8"
              fontSize="14"
              fontFamily="Arial, sans-serif"
            >
              Trader
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}