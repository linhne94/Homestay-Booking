'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Tắt loading khi pathname thay đổi (đã sang trang mới)
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');
        
        // Chỉ kích hoạt loading nếu là link nội bộ, không mở tab mới, và không phải link neo (#)
        if (
          href && 
          href.startsWith('/') && 
          !href.includes('#') && 
          targetAttr !== '_blank'
        ) {
          const currentUrl = window.location.pathname;
          if (href !== currentUrl) {
            setLoading(true);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-[#C8B99A]/30 overflow-hidden">
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-20%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loadingBar 1.5s infinite linear;
        }
      `}</style>
      <div className="h-full bg-[#3D5A40] w-full animate-loading-bar origin-left"></div>
    </div>
  );
}
