import { useEffect, useRef } from 'react';

export const useIdleTimer = (timeout: number, onIdle: () => void, enabled: boolean = true) => {
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(onIdle, timeout);
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer(); // Start timer

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeout, onIdle, enabled]);
};
