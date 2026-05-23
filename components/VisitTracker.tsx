"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitTracker() {
    const pathname = usePathname();
    const hasTracked = useRef<Set<string>>(new Set());

    useEffect(() => {

        if (pathname.includes('/admin')) return;

        const trackKey = `${pathname}_${new Date().toDateString()}`;
        if (hasTracked.current.has(trackKey)) return;

        const trackVisit = async () => {
            try {
                const response = await fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: pathname,
                        userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined
                    })
                });

                if (response.ok) {
                    hasTracked.current.add(trackKey);
                }
            } catch (e) {

            }
        };

        const timer = setTimeout(trackVisit, 500);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
