'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useRegime } from '@/lib/ui/regime';
import { Button } from './button';

// Modal variants with regime-aware styling
const modalVariants = cva(
  `relative mx-auto my-8 w-full max-h-[90vh] overflow-hidden transition-all duration-300
   data-[regime=shock]:shadow-shock data-[regime=elevated]:shadow-elevated data-[regime=calm]:shadow-card`,
  {
    variants: {
      size: {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl mx-4',
      },
      variant: {
        default: `bg-panel border border-panel/30 rounded-2xl shadow-card
                 data-[regime=shock]:border-warn/20 data-[regime=shock]:bg-panel/95
                 data-[regime=elevated]:border-accent1/20 data-[regime=elevated]:bg-panel/90`,
        
        glass: `bg-panel/20 backdrop-blur-xl border border-panel/25 rounded-2xl
               data-[regime=shock]:bg-panel/25 data-[regime=shock]:border-warn/15
               data-[regime=elevated]:bg-panel/22 data-[regime=elevated]:border-accent1/15`,
        
        minimal: `bg-panel/95 backdrop-blur-sm rounded-2xl border-0 shadow-xl`,
        
        sidebar: `bg-panel border-l border-panel/30 rounded-none h-full ml-auto
                 data-[regime=shock]:border-warn/20 data-[regime=elevated]:border-accent1/20`,
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  size,
  variant,
  className,
  children,
  ...props
}: ModalProps) {
  const regimeData = useRegime();

  // Handle body scroll lock
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Portal check
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className={`absolute inset-0 transition-all duration-300 ${
              regimeData.regime === 'volatile' ? 'bg-bg/80 backdrop-blur-md' :
              regimeData.regime === 'bull' ? 'bg-bg/85 backdrop-blur-lg' :
              'bg-bg/90 backdrop-blur-xl'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            className={cn(
              modalVariants({ size, variant }),
              'relative z-10',
              className
            )}
            data-regime={regimeData.regime}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              y: variant === 'sidebar' ? '100%' : 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: variant === 'sidebar' ? '100%' : 20
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex-1">
                  {title && (
                    <motion.h2 
                      className="text-xl font-semibold text-gray-100"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {title}
                    </motion.h2>
                  )}
                  {description && (
                    <motion.p 
                      className="text-sm text-gray-400 mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
                
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className={`ml-4 p-2 rounded-lg hover:bg-panel/50 text-gray-400 hover:text-gray-200 transition-colors duration-200
                               data-[regime=shock]:hover:text-warn data-[regime=elevated]:hover:text-accent1 data-[regime=calm]:hover:text-brand1`}
                    data-regime={regimeData.regime}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </div>
            )}
            
            {/* Content */}
            <motion.div 
              className="px-6 pb-6 overflow-y-auto max-h-[70vh]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const getConfirmVariant = () => {
    switch (variant) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      default: return 'primary';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 mx-auto bg-neg/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-neg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 mx-auto bg-warn/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 mx-auto bg-brand1/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant="glass"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      showCloseButton={false}
    >
      <div className="text-center">
        {getIcon()}
        
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          
          <Button
            variant={getConfirmVariant()}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Quick Sheet Modal (mobile-optimized)
interface QuickSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export function QuickSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
}: QuickSheetProps) {
  const getHeightClass = () => {
    switch (height) {
      case 'half': return 'h-1/2';
      case 'full': return 'h-full';
      default: return 'max-h-[80vh]';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-panel border-t border-panel/30 rounded-t-2xl overflow-hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${getHeightClass()}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-500 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-100">
              {title}
            </h2>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 pb-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
