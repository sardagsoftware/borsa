import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-smooth select-none",
  {
    variants: {
      variant: {
        default: "bg-panel text-gray-200 border border-panel/30",
        primary: "bg-brand1/20 text-brand1 border border-brand1/30",
        secondary: "bg-brand2/20 text-brand2 border border-brand2/30", 
        positive: "bg-pos/20 text-pos border border-pos/30",
        negative: "bg-neg/20 text-neg border border-neg/30",
        accent: "bg-accent1/20 text-accent1 border border-accent1/30",
        glass: "bg-panel/20 backdrop-blur-sm text-gray-300 border border-panel/30",
        outline: "bg-transparent text-gray-300 border border-panel/50 hover:bg-panel/20",
        solid: "bg-panel/80 text-gray-100 border-0 shadow-soft",
      },
      size: {
        xs: "h-5 px-2 text-xs rounded-full",
        sm: "h-6 px-3 text-xs rounded-full",
        default: "h-7 px-3 text-sm rounded-full",
        lg: "h-8 px-4 text-sm rounded-full",
        xl: "h-10 px-5 text-base rounded-full",
      },
      interactive: {
        true: "cursor-pointer hover:scale-105 active:scale-95",
        false: "cursor-default",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      interactive: false,
    },
  }
)

export interface PillProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pillVariants> {}

const Pill = React.forwardRef<HTMLDivElement, PillProps>(
  ({ className, variant, size, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(pillVariants({ variant, size, interactive, className }))}
        {...props}
      />
    )
  }
)
Pill.displayName = "Pill"

export { Pill, pillVariants }
