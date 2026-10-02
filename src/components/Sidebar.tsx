'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Boxes, PlusCircle, ArrowLeftRight, Database, LogOut, UserCheck, Users, Tags, FileText, Building2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CurrentUser {
  userId: string;
  username: string;
  name: string;
  role: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (pathname !== '/login' && !pathname.startsWith('/scan/')) {
      fetchUser();
    }
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ต้องการออกจากระบบใช่หรือไม่?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('ต้องการสร้างข้อมูลครุภัณฑ์ตัวอย่างใหม่หรือไม่? (ข้อมูลเดิมจะถูกรีเซ็ต)')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/assets/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`จำลองข้อมูลครุภัณฑ์เรียบร้อยแล้ว (${data.count} รายการ)`);
        window.location.reload();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการสร้างข้อมูลตัวอย่าง: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  if (pathname === '/login' || pathname.startsWith('/scan/')) {
    return null;
  }

  const navItems = [
    { label: 'ภาพรวมระบบ (Dashboard)', href: '/', icon: LayoutDashboard },
    { label: 'ครุภัณฑ์ทั้งหมด (Assets)', href: '/assets', icon: Boxes },
    { label: 'หมวดหมู่ครุภัณฑ์ (Categories)', href: '/categories', icon: Tags },
    { label: 'โครงสร้างหน่วยงาน (Divisions)', href: '/divisions', icon: Building2 },
    { label: 'เบิก / ยืม-คืน (Borrow/Return)', href: '/borrow', icon: ArrowLeftRight },
    { label: 'รายงาน (Reports)', href: '/reports', icon: FileText },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ label: 'จัดการผู้ใช้งาน (Users)', href: '/users', icon: Users });
  }

  const content = (
    <div className="flex flex-col justify-between h-full p-4">
      <div>
        <div className="flex items-center justify-between px-2 py-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">ระบบคุมครุภัณฑ์</h1>
              <p className="text-xs text-slate-400">Asset Management</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {currentUser && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">@{currentUser.username}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-600 text-white shrink-0">
              {currentUser.role}
            </span>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <Database className="w-4 h-4 text-indigo-400" />
          {seeding ? 'กำลังสร้างข้อมูล...' : 'จำลองข้อมูลตัวอย่าง (Seed)'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs rounded-lg transition-colors border border-rose-900/60 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ (Logout)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 min-h-screen flex-col justify-between shadow-xl border-r border-slate-800 shrink-0 print:hidden">
        {content}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs" onClick={onClose}></div>
          {/* Drawer Content */}
          <aside className="relative z-10 w-72 max-w-[80vw] bg-slate-900 text-slate-100 h-full flex flex-col shadow-2xl border-r border-slate-800">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
