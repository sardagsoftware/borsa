'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useRegime } from '@/lib/ui/regime';

// Input field variants with regime awareness
const inputVariants = cva(
  `w-full transition-all duration-300 ease-out
   focus:outline-none focus-visible:outline-none
   disabled:opacity-50 disabled:cursor-not-allowed
   placeholder:text-gray-500`,
  {
    variants: {
      variant: {
        default: `bg-panel/50 border border-panel/40 rounded-xl px-4 py-3
                 hover:bg-panel/70 hover:border-panel/60
                 focus:bg-panel focus:border-brand1/50 focus:ring-2 focus:ring-brand1/20
                 data-[regime=shock]:focus:border-warn/50 data-[regime=shock]:focus:ring-warn/20
                 data-[regime=elevated]:focus:border-accent1/50 data-[regime=elevated]:focus:ring-accent1/20`,
        
        outline: `bg-transparent border-2 border-panel/40 rounded-xl px-4 py-3
                 hover:border-panel/60 focus:border-brand1/70
                 data-[regime=shock]:focus:border-warn/70
                 data-[regime=elevated]:focus:border-accent1/70`,
        
        filled: `bg-panel border-0 rounded-xl px-4 py-3 shadow-inner
                hover:bg-panel/80 focus:bg-panel/90 focus:shadow-lg`,
        
        minimal: `bg-transparent border-0 border-b-2 border-panel/40 rounded-none px-2 py-2
                 hover:border-panel/60 focus:border-brand1/70
                 data-[regime=shock]:focus:border-warn/70
                 data-[regime=elevated]:focus:border-accent1/70`,
        
        glass: `bg-panel/20 backdrop-blur-sm border border-panel/30 rounded-xl px-4 py-3
               hover:bg-panel/30 hover:border-panel/50
               focus:bg-panel/40 focus:border-brand1/50`,
      },
      
      size: {
        sm: 'text-sm py-2 px-3',
        default: 'text-base py-3 px-4',
        lg: 'text-lg py-4 px-5',
      },
      
      state: {
        default: '',
        error: 'border-neg/70 focus:border-neg focus:ring-neg/20 bg-neg/5',
        success: 'border-pos/70 focus:border-pos focus:ring-pos/20 bg-pos/5',
        warning: 'border-warn/70 focus:border-warn focus:ring-warn/20 bg-warn/5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  onClear?: () => void;
  showClear?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    label, 
    hint, 
    error, 
    success, 
    leftIcon, 
    rightIcon, 
    loading = false,
    onClear,
    showClear = false,
    value,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const { regime } = useRegime();
    
    // Determine state based on error/success props
    const currentState = error ? 'error' : success ? 'success' : state;
    const hasValue = Boolean(value && value.toString().length > 0);

    const getIconColor = () => {
      switch (currentState) {
        case 'error': return 'text-neg';
        case 'success': return 'text-pos';
        case 'warning': return 'text-warn';
        default: 
          return focused 
            ? regime === 'shock' ? 'text-warn' :
              regime === 'elevated' ? 'text-accent1' :
              'text-brand1'
            : 'text-gray-500';
      }
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              focused 
                ? regime === 'shock' ? 'text-warn' :
                  regime === 'elevated' ? 'text-accent1' :
                  'text-brand1'
                : 'text-gray-300'
            }`}
          >
            {label}
          </motion.label>
        )}
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${getIconColor()}`}>
              {leftIcon}
            </div>
          )}
          
          {/* Input field */}
          <input
            ref={ref}
            value={value}
            className={cn(
              inputVariants({ variant, size, state: currentState }),
              leftIcon && 'pl-10',
              (rightIcon || loading || (showClear && hasValue)) && 'pr-10',
              className
            )}
            data-regime={regime}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Loading spinner */}
            {loading && (
              <div className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${getIconColor()}`} />
            )}
            
            {/* Clear button */}
            {!loading && showClear && hasValue && onClear && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onClear}
                type="button"
                className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-400 text-white text-xs flex items-center justify-center transition-colors duration-200`}
              >
                ×
              </motion.button>
            )}
            
            {/* Right icon */}
            {!loading && rightIcon && (
              <div className={`transition-colors duration-200 ${getIconColor()}`}>
                {rightIcon}
              </div>
            )}
          </div>
          
          {/* Focus ring for better accessibility */}
          {focused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute inset-0 rounded-xl pointer-events-none border-2 ${
                regime === 'shock' ? 'border-warn/30' :
                regime === 'elevated' ? 'border-accent1/30' :
                'border-brand1/30'
              }`}
            />
          )}
        </div>
        
        {/* Helper text */}
        <AnimatePresence mode="wait">
          {(hint || error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="mt-2"
            >
              {error && (
                <p className="text-sm text-neg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
              
              {!error && success && (
                <p className="text-sm text-pos flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </p>
              )}
              
              {!error && !success && hint && (
                <p className="text-sm text-gray-400">
                  {hint}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component with similar styling
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  resize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    label, 
    hint, 
    error, 
    success, 
    resize = true,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const { regime } = useRegime();
    
    const currentState = error ? 'error' : success ? 'success' : state;

    return (
      <div className="w-full">
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              focused 
                ? regime === 'shock' ? 'text-warn' :
                  regime === 'elevated' ? 'text-accent1' :
                  'text-brand1'
                : 'text-gray-300'
            }`}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              inputVariants({ variant, size, state: currentState }),
              'min-h-[120px]',
              !resize && 'resize-none',
              className
            )}
            data-regime={regime}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {focused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute inset-0 rounded-xl pointer-events-none border-2 ${
                regime === 'shock' ? 'border-warn/30' :
                regime === 'elevated' ? 'border-accent1/30' :
                'border-brand1/30'
              }`}
            />
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {(hint || error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2"
            >
              {error && (
                <p className="text-sm text-neg">{error}</p>
              )}
              {!error && success && (
                <p className="text-sm text-pos">{success}</p>
              )}
              {!error && !success && hint && (
                <p className="text-sm text-gray-400">{hint}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Search input with built-in functionality
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onSearch?: (query: string) => void;
  clearOnSearch?: boolean;
}

export function SearchInput({ 
  onSearch, 
  clearOnSearch = false, 
  value, 
  onChange,
  ...props 
}: SearchInputProps) {
  const [query, setQuery] = useState(value || '');

  const handleSearch = () => {
    onSearch?.(query.toString());
    if (clearOnSearch) {
      setQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Input
      {...props}
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        onChange?.(e);
      }}
      onKeyPress={handleKeyPress}
      leftIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightIcon={
        query && (
          <button
            onClick={handleSearch}
            className="hover:text-brand1 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )
      }
      showClear={Boolean(query)}
      onClear={() => setQuery('')}
    />
  );
}

export default Input;
