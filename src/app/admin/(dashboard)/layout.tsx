import React from 'react';
import Link from 'next/link';
import { getSessionStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BranchSwitcher from '@/components/admin/BranchSwitcher';
import { 
  LayoutDashboard, 
  CalendarRange, 
  BookOpen, 
  MapPin, 
  BedDouble, 
  CalendarDays, 
  Percent, 
  RefreshCw, 
  Star, 
  Users, 
  BarChart3, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { logoutAction } from '../../actions/auth'; // updated depth to match (dashboard) group!

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getSessionStaff();

  // Mặc dù middleware đã bảo vệ, nhưng double-check cho chắc chắn
  if (!staff) {
    redirect('/admin/login');
  }

  const isAdmin = staff.staff_profile.role === 'ADMIN';

  // Lấy danh sách chi nhánh hoạt động nếu là admin
  const branches = isAdmin
    ? await prisma.branch.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : [];

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Sơ đồ Timeline', href: '/admin/timeline', icon: CalendarRange },
    { name: 'Quản lý Booking', href: '/admin/bookings', icon: BookOpen },
    ...(isAdmin ? [{ name: 'Quản lý Chi nhánh', href: '/admin/branches', icon: MapPin }] : []),
    { name: 'Quản lý Phòng', href: '/admin/rooms', icon: BedDouble },
    { name: 'Lịch Giá (Override)', href: '/admin/pricing', icon: CalendarDays },
    { name: 'Khuyến Mãi', href: '/admin/promotions', icon: Percent },
    { name: 'Đồng bộ OTA', href: '/admin/ota', icon: RefreshCw },
    { name: 'Đánh Giá', href: '/admin/reviews', icon: Star },
    ...(isAdmin ? [{ name: 'Nhân Sự & Phân Quyền', href: '/admin/staff', icon: Users }] : []),
    ...(isAdmin ? [{ name: 'Báo Cáo Snapshot', href: '/admin/reports', icon: BarChart3 }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0C10] text-[#FAF9F6] font-sans selection:bg-[#C5A880]/30 antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161920] border-r border-[#232731] flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Header Logo */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-[#232731]">
          <span className="font-serif text-xl font-bold tracking-wide text-[#FAF9F6]">
            GALOPHY
          </span>
          <span className="text-[9px] tracking-[0.3em] text-[#C5A880] uppercase font-bold -mt-0.5">
            ADMIN PORTAL
          </span>
        </div>

        {/* User profile brief */}
        <div className="px-6 py-4 border-b border-[#232731] flex items-center gap-3 bg-[#0B0C10]/40">
          {staff.avatar_url ? (
            <img 
              src={staff.avatar_url} 
              alt={staff.full_name} 
              className="w-10 h-10 rounded-full object-cover border border-[#C5A880]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#232731] flex items-center justify-center border border-[#FAF9F6]/10">
              <UserIcon className="w-5 h-5 text-[#C5A880]" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate text-[#FAF9F6]">{staff.full_name}</span>
            <span className="text-[10px] text-[#C5A880] truncate font-medium uppercase tracking-wider mt-0.5">
              {staff.staff_profile.role === 'ADMIN' ? 'Administrator' : 'Receptionist'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-[#232731]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-[#FAF9F6]/75 hover:text-[#FAF9F6] hover:bg-[#232731] transition-all group"
              >
                <Icon className="w-4 h-4 text-[#C5A880] group-hover:scale-105 transition-transform" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-[#232731]">
          <form action={logoutAction}>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#232731]/50 text-[#FAF9F6]/85 hover:text-[#FAF9F6] hover:bg-red-950/30 border border-[#232731] hover:border-red-900/50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <header className="h-20 bg-[#161920] border-b border-[#232731] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#FAF9F6]/50">Chi nhánh đang quản lý:</span>
            <BranchSwitcher
              branches={branches}
              currentBranchId={staff.staff_profile.branch_id}
              currentBranchName={staff.staff_profile.branch.name}
              isAdmin={isAdmin}
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-light text-[#FAF9F6]/70">
            <span>Hệ thống: Live</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-8 flex-1 bg-[#0B0C10]">
          {children}
        </main>
      </div>
    </div>
  );
}
