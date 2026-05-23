import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card rounded-2xl p-8 w-full max-w-md border border-neutral-700/50 relative overflow-hidden",
                className
            )}
            {...props}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
            {children}
        </div>
    );
}
