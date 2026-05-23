import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const rateLimitMap = new Map<string, number>();

export const rateLimiter = {
    check: (ip: string, limit: number, windowMs: number) => {
        const now = Date.now();
        const lastRequestTime = rateLimitMap.get(ip) || 0;

        if (now - lastRequestTime < windowMs) {
            return false;
        }

        rateLimitMap.set(ip, now);
        return true;
    }
};
