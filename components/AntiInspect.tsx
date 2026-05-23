"use client";

import { useEffect } from "react";

export function AntiInspect() {
    useEffect(() => {

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {

            if (e.key === "F12" || e.keyCode === 123) {
                e.preventDefault();
                return false;
            }

            if (
                e.ctrlKey &&
                e.shiftKey &&
                (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "i" || e.key === "j" || e.key === "c")
            ) {
                e.preventDefault();
                return false;
            }

            if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
}
