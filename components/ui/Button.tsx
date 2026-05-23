import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    variant?: "primary" | "secondary" | "ghost"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, isLoading, variant = "primary", ...props }, ref) => {
        const variants = {
            primary: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-900/20 border border-purple-400/20",
            secondary: "bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10",
            ghost: "hover:bg-white/5 text-neutral-400 hover:text-white"
        }

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                    variants[variant],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
