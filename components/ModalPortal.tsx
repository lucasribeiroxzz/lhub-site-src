'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
    children: ReactNode;
    isOpen: boolean;
}

export default function ModalPortal({ children, isOpen }: ModalPortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    return createPortal(
        children,
        document.body
    );
}
