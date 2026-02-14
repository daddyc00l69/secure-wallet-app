import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const PrivacyShield: React.FC = () => {
    const { user } = useAuth();
    const canScreenshot = user?.canScreenshot || false;

    useEffect(() => {
        if (canScreenshot) return;

        // 1. Prevent Right Click
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        // 2. Blur on Window Blur (prevents screen recording picking up content easily if switching apps, 
        // and some recorders on mobile might be blocked by this if they trigger blur)
        const handleBlur = () => {
            document.body.style.filter = 'blur(20px)';
        };
        const handleFocus = () => {
            document.body.style.filter = 'none';
        };

        // 3. User Select None
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.body.style.filter = 'none';
            document.body.style.userSelect = 'auto';
            document.body.style.webkitUserSelect = 'auto';
        };
    }, [canScreenshot]);

    if (canScreenshot) return null;

    // Watermark
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex flex-wrap opacity-[0.03] select-none">
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-60 h-60 flex items-center justify-center -rotate-45 text-sm font-bold text-black">
                    {user?.username} • {user?._id?.slice(-4)} <br />
                    {new Date().toLocaleDateString()}
                    <br /> NO SCREENSHOTS
                </div>
            ))}
        </div>
    );
};
