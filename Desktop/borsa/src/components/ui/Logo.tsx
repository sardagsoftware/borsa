'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function Logo({ size = 'md', animated = true, className = '' }: LogoProps) {
  const sizes = {
    sm: 'w-48 h-14',
    md: 'w-64 h-18',
    lg: 'w-80 h-24'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        {/* Glow effect */}
        {animated && (
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 blur-2xl"
          />
        )}

        {/* Main Logo SVG */}
        <svg
          viewBox="0 0 320 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            {/* Premium Gradients */}
            <linearGradient id="primary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient id="secondary-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Hexagon Icon */}
          <g transform="translate(15, 36)">
            <polygon
              points="0,-18 15.6,-9 15.6,9 0,18 -15.6,9 -15.6,-9"
              stroke="url(#primary-gradient)"
              strokeWidth="2.5"
              fill="none"
              filter="url(#glow)"
            />
            <polygon
              points="0,-12 10.4,-6 10.4,6 0,12 -10.4,6 -10.4,-6"
              stroke="url(#secondary-gradient)"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />

            {/* Center dot with pulse */}
            {animated ? (
              <motion.circle
                cx="0"
                cy="0"
                r="3"
                fill="url(#secondary-gradient)"
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            ) : (
              <circle cx="0" cy="0" r="3" fill="url(#secondary-gradient)" />
            )}

            {/* Corner accent dots */}
            <circle cx="0" cy="-18" r="2" fill="#10b981" opacity="0.8" />
            <circle cx="15.6" cy="9" r="2" fill="#06b6d4" opacity="0.8" />
            <circle cx="-15.6" cy="9" r="2" fill="#8b5cf6" opacity="0.8" />
          </g>

          {/* Trading Chart Line */}
          <g transform="translate(48, 40)">
            <path
              d="M0,0 L8,-8 L16,-4 L24,-12 L32,-8 L40,-16"
              stroke="url(#primary-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.7"
            />

            {animated && (
              <>
                <motion.circle
                  cx="8"
                  cy="-8"
                  r="2.5"
                  fill="#10b981"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.circle
                  cx="24"
                  cy="-12"
                  r="2.5"
                  fill="#06b6d4"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
                <motion.circle
                  cx="40"
                  cy="-16"
                  r="2.5"
                  fill="#8b5cf6"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                />
              </>
            )}
          </g>

          {/* LyDian Text */}
          <text
            x="100"
            y="45"
            fill="url(#primary-gradient)"
            fontSize="36"
            fontWeight="900"
            fontFamily="'Inter', system-ui, -apple-system, sans-serif"
            letterSpacing="-1"
            filter="url(#glow)"
          >
            LyDian
          </text>

          {/* Trader Text */}
          <text
            x="225"
            y="45"
            fill="#94a3b8"
            fontSize="24"
            fontWeight="700"
            fontFamily="'Inter', system-ui, sans-serif"
            letterSpacing="2"
          >
            TRADER
          </text>

          {/* AI Badge */}
          <g transform="translate(295, 28)">
            <rect
              x="0"
              y="0"
              width="20"
              height="12"
              rx="6"
              fill="url(#secondary-gradient)"
              opacity="0.9"
            />
            <text
              x="10"
              y="9"
              fill="#ffffff"
              fontSize="7"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
            >
              AI
            </text>
          </g>

          {/* Underline accent */}
          <line
            x1="100"
            y1="52"
            x2="190"
            y2="52"
            stroke="url(#primary-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* PRO badge */}
          <text
            x="194"
            y="52"
            fill="url(#secondary-gradient)"
            fontSize="10"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            PRO
          </text>
        </svg>
      </div>
    </div>
  );
}