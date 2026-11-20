'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu, Boxes } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 60-minute inactivity auto-logout
  useEffect(() => {
    if (pathname === '/login' || pathname.startsWith('/scan/')) return;

    let timer: NodeJS.Timeout;
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutes

    const handleTimeout = async () => {
      try {
        await fetch('/assets/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      } finally {
        window.location.href = '/assets/login';
      }
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleTimeout, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Start timer on mount
    resetTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname]);

  // Dedicated full-bleed pages without admin sidebar or top navigation
  if (pathname === '/login' || pathname.startsWith('/scan/')) {
    return <div className="min-h-screen w-full bg-slate-100 text-slate-900">{children}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row bg-slate-100 text-slate-900 min-h-screen font-sans antialiased w-full print:block print:bg-white print:min-h-0 print:w-full print:p-0 print:m-0">
      {/* Mobile Top Header Navigation */}
      <header className="md:hidden bg-slate-900 text-slate-100 px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800 shrink-0 sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none text-white">ระบบคุมครุภัณฑ์</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">กรมอุตุนิยมวิทยา</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Responsive Sidebar (Desktop Static + Mobile Drawer) */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Page Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-h-screen print:p-0 print:m-0 print:w-full print:max-h-none print:overflow-visible print:bg-white">
        {children}
      </main>
    </div>
  );
}
