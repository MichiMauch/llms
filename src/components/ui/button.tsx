import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-400 hover:bg-primary-500 text-white shadow-sm hover:shadow-md",
        destructive:
          "bg-danger-500 hover:bg-danger-600 text-white shadow-sm hover:shadow-md",
        outline:
          "border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow-md",
        secondary:
          "bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm hover:shadow-md",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-primary-400 underline-offset-4 hover:underline",
        success: "bg-success-500 hover:bg-success-600 text-white shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }