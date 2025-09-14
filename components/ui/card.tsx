import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useRegime } from "@/lib/ui/regime"

// Enhanced card variants with regime-aware styling
const cardVariants = cva(
  `rounded-2xl transition-all duration-300 ease-out overflow-hidden group relative
   data-[regime=shock]:shadow-shock data-[regime=elevated]:shadow-elevated data-[regime=calm]:shadow-soft`,
  {
    variants: {
      variant: {
        // Default card with subtle regime awareness
        default: `bg-panel border border-panel/30 shadow-card hover:shadow-card-lg
                 data-[regime=shock]:border-warn/20 data-[regime=shock]:bg-panel/95
                 data-[regime=elevated]:border-accent1/20 data-[regime=elevated]:bg-panel/90
                 data-[regime=calm]:border-brand1/10`,
        
        // Glass morphism with depth
        glass: `bg-panel/15 backdrop-blur-md border border-panel/25 shadow-soft
               hover:bg-panel/20 hover:border-panel/35
               data-[regime=shock]:bg-panel/20 data-[regime=shock]:border-warn/15
               data-[regime=elevated]:bg-panel/18 data-[regime=elevated]:border-accent1/15`,
        
        // Elevated with hover effects
        elevated: `bg-panel shadow-card border border-panel/40 
                  hover:shadow-card-lg hover:-translate-y-1 transform-gpu
                  data-[regime=shock]:hover:shadow-shock
                  data-[regime=elevated]:hover:shadow-elevated`,
        
        // Flat minimal style
        flat: `bg-panel/60 border-0 shadow-none hover:bg-panel/80
              data-[regime=shock]:bg-panel/70 data-[regime=elevated]:bg-panel/65`,
        
        // Outline style
        outline: `bg-transparent border border-panel/40 shadow-none hover:bg-panel/10
                 data-[regime=shock]:border-warn/30 data-[regime=shock]:hover:bg-warn/5
                 data-[regime=elevated]:border-accent1/30 data-[regime=elevated]:hover:bg-accent1/5`,
        
        // Gradient backgrounds
        gradient: `bg-gradient-to-br from-panel/80 to-panel/40 border border-panel/25 shadow-card
                  data-[regime=shock]:from-panel/85 data-[regime=shock]:to-warn/5
                  data-[regime=elevated]:from-panel/82 data-[regime=elevated]:to-accent1/5`,
        
        // New variants for enhanced UX
        interactive: `bg-panel border border-panel/30 shadow-card cursor-pointer
                     hover:shadow-card-lg hover:scale-[1.02] hover:border-brand1/30
                     active:scale-[0.98] transform-gpu
                     data-[regime=shock]:hover:border-warn/40
                     data-[regime=elevated]:hover:border-accent1/40`,
        
        success: `bg-pos/10 border border-pos/20 shadow-soft
                 text-pos-light hover:bg-pos/15`,
        
        warning: `bg-warn/10 border border-warn/20 shadow-soft
                 text-warn-light hover:bg-warn/15`,
        
        danger: `bg-neg/10 border border-neg/20 shadow-soft
                text-neg-light hover:bg-neg/15`,
        
        premium: `bg-gradient-to-br from-brand1/10 via-brand2/5 to-brand3/10 
                 border border-brand1/20 shadow-card
                 hover:shadow-card-lg hover:from-brand1/15`,
      },
      padding: {
        none: "p-0",
        xs: "p-2",
        sm: "p-4",
        default: "p-6", 
        lg: "p-8",
        xl: "p-10",
      },
      size: {
        sm: "max-w-sm",
        default: "",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, size, interactive = false, ...props }, ref) => {
    const { regime } = useRegime()
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ 
          variant: interactive ? "interactive" : variant, 
          padding, 
          size, 
          className 
        }))}
        data-regime={regime}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

// Enhanced header with better typography
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex flex-col space-y-1.5",
      compact ? "p-4 pb-2" : "p-6 pb-4",
      className
    )} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ className, level = 3, children, ...props }, ref) => {
  const sizeClass = {
    1: "text-2xl",
    2: "text-xl", 
    3: "text-lg",
    4: "text-base",
    5: "text-sm",
    6: "text-xs",
  }[level]

  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-tight tracking-tight text-gray-100",
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      compact ? "p-4 pt-0" : "p-6 pt-2", 
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean; justify?: "start" | "center" | "end" | "between" }
>(({ className, compact = false, justify = "start", ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center gap-3",
      compact ? "p-4 pt-2" : "p-6 pt-4",
      justify === "start" && "justify-start",
      justify === "center" && "justify-center", 
      justify === "end" && "justify-end",
      justify === "between" && "justify-between",
      className
    )} 
    {...props} 
  />
))
CardFooter.displayName = "CardFooter"

// New specialized card components
const CardMetric = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string
    value: string | number
    change?: string | number
    trend?: "up" | "down" | "neutral"
    compact?: boolean
  }
>(({ className, label, value, change, trend = "neutral", compact = false, ...props }, ref) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-pos"
      case "down": return "text-neg"
      default: return "text-gray-400"
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        compact ? "p-3" : "p-4",
        className
      )}
      {...props}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-gray-100">
          {value}
        </span>
        {change && (
          <span className={cn("text-sm font-medium", getTrendColor())}>
            {typeof change === 'number' && change > 0 ? '+' : ''}{change}
            {trend !== "neutral" && (trend === "up" ? "↗" : "↘")}
          </span>
        )}
      </div>
    </div>
  )
})
CardMetric.displayName = "CardMetric"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardMetric,
  cardVariants 
}
