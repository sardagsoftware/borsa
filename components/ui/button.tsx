import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useRegime } from "@/lib/ui/regime"

// Enhanced button variants with regime-aware styling
const buttonVariants = cva(
  // Base styles with improved focus states and accessibility
  `inline-flex items-center justify-center font-medium relative overflow-hidden
   transition-all duration-300 ease-out transform-gpu
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand1/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
   disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed 
   select-none touch-manipulation active:scale-[0.98]
   data-[regime=shock]:shadow-shock data-[regime=elevated]:shadow-elevated data-[regime=calm]:shadow-soft`,
  {
    variants: {
      variant: {
        // Primary - Brand color with regime-aware intensity
        primary: `bg-brand1 text-bg font-semibold
                 hover:bg-brand1/90 active:bg-brand1/80 
                 shadow-soft hover:shadow-md active:shadow-sm
                 data-[regime=shock]:bg-warn data-[regime=shock]:shadow-shock
                 data-[regime=elevated]:bg-accent1 data-[regime=elevated]:shadow-elevated`,
        
        // Secondary - Complementary brand color
        secondary: `bg-brand2 text-white font-medium
                   hover:bg-brand2/90 active:bg-brand2/80 
                   shadow-soft hover:shadow-md active:shadow-sm
                   data-[regime=shock]:bg-brand3 
                   data-[regime=elevated]:bg-brand2/80`,
        
        // Outline - Sophisticated border style
        outline: `border border-panel/40 bg-transparent text-brand1 font-medium
                 hover:bg-panel/30 hover:border-brand1/50 active:bg-panel/50 
                 backdrop-blur-sm
                 data-[regime=shock]:border-warn/50 data-[regime=shock]:text-warn 
                 data-[regime=elevated]:border-accent1/50 data-[regime=elevated]:text-accent1`,
        
        // Ghost - Minimal style
        ghost: `bg-transparent text-gray-300 
               hover:bg-panel/20 hover:text-brand1 active:bg-panel/30
               data-[regime=shock]:hover:text-warn data-[regime=shock]:hover:bg-warn/10
               data-[regime=elevated]:hover:text-accent1 data-[regime=elevated]:hover:bg-accent1/10`,
        
        // Panel - Surface color
        panel: `bg-panel text-gray-200 font-medium
               hover:bg-panel/80 active:bg-panel/60 
               shadow-soft border border-panel/20`,
        
        // Trading actions
        positive: `bg-pos text-bg font-semibold
                  hover:bg-pos/90 active:bg-pos/80 
                  shadow-soft hover:shadow-md active:shadow-sm`,
        
        negative: `bg-neg text-white font-semibold
                  hover:bg-neg/90 active:bg-neg/80 
                  shadow-soft hover:shadow-md active:shadow-sm`,
        
        // Glass morphism
        glass: `bg-panel/15 backdrop-blur-md border border-panel/25 text-gray-200
               hover:bg-panel/25 hover:border-panel/35 active:bg-panel/35
               shadow-soft`,
        
        // Link style
        link: `underline-offset-4 hover:underline text-brand1 bg-transparent p-0 h-auto
              data-[regime=shock]:text-warn data-[regime=elevated]:text-accent1`,
        
        // New variants for enhanced UX
        success: `bg-pos/90 text-bg font-medium
                 hover:bg-pos active:bg-pos/80 
                 shadow-soft`,
        
        warning: `bg-warn text-bg font-medium
                 hover:bg-warn/90 active:bg-warn/80 
                 shadow-shock`,
        
        danger: `bg-neg text-white font-medium
                hover:bg-neg/90 active:bg-neg/80 
                shadow-soft`,
        
        premium: `bg-gradient-to-r from-brand1 via-brand2 to-brand3 text-bg font-bold
                 hover:scale-[1.02] active:scale-[0.98] 
                 shadow-lg hover:shadow-xl animate-gradient-x`,
      },
      size: {
        xs: "h-6 px-2 text-xs rounded-md gap-1",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        default: "h-10 px-4 text-sm rounded-xl gap-2",
        lg: "h-12 px-6 text-base rounded-xl gap-2.5",
        xl: "h-14 px-8 text-lg rounded-2xl gap-3",
        "2xl": "h-16 px-10 text-xl rounded-2xl gap-3.5",
        icon: "h-10 w-10 rounded-xl",
        "icon-xs": "h-6 w-6 rounded-md",
        "icon-sm": "h-8 w-8 rounded-lg", 
        "icon-lg": "h-12 w-12 rounded-xl",
        "icon-xl": "h-14 w-14 rounded-2xl",
        // Mobile-optimized sizes
        touch: "h-12 px-6 text-base rounded-xl min-w-[44px]", // 44px minimum touch target
        "touch-lg": "h-14 px-8 text-lg rounded-2xl min-w-[44px]",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      loading: false,
    },
  }
)

// Loading spinner component
const LoadingSpinner = () => (
  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const { regime } = useRegime()
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, loading, className }))}
        data-regime={regime}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            {children && <span className="ml-2">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

// Enhanced button group component
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  size?: VariantProps<typeof buttonVariants>['size']
  variant?: VariantProps<typeof buttonVariants>['variant']
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === 'horizontal' ? "flex-row" : "flex-col",
          "[&>button:not(:first-child)]:border-l-0 [&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:rounded-l-none",
          orientation === 'vertical' && "[&>button:not(:first-child)]:border-t-0 [&>button:not(:last-child)]:rounded-b-none [&>button:not(:first-child)]:rounded-t-none [&>button:not(:first-child)]:border-l [&>button:not(:last-child)]:border-l",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export { Button, ButtonGroup, buttonVariants }
