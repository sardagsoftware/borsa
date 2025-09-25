'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'neon';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  rightElement,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 rounded-lg transition-all duration-300 focus:outline-none';
  
  const variantClasses = {
    default: `
      bg-gray-800 border border-gray-700 text-white placeholder-gray-400
      focus:border-accent-1 focus:ring-2 focus:ring-accent-1/20
    `,
    neon: `
      neon-border bg-gray-900/50 backdrop-blur-sm text-white placeholder-gray-400
      focus:shadow-lg focus:shadow-accent-1/20
    `,
  };

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${icon ? 'pl-10' : ''}
    ${rightElement ? 'pr-10' : ''}
    ${error ? 'border-red-500 focus:border-red-500' : ''}
    ${className}
  `.trim();

  return (
    <div className="w-full">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;