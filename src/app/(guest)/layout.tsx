import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { LogOut, User as UserIcon, Calendar, Menu, Shield } from 'lucide-react';

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#1E463C] font-sans selection:bg-[#C5A880]/30">
      {/* Navbar cao cấp Eco-Luxury */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF9F6]/80 border-b border-[#1E463C]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link href="/" className="flex flex-col cursor-pointer">
            <span className="font-serif text-2xl font-bold tracking-wide text-[#1E463C] hover:opacity-90 transition-opacity">
              GALOPHY
            </span>
            <span className="text-[10px] tracking-[0.25em] text-[#C5A880] uppercase font-medium -mt-1">
              RETREATS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <Link href="/" className="hover:text-[#C5A880] transition-colors cursor-pointer">
              Trang Chủ
            </Link>
            <Link href="/#rooms" className="hover:text-[#C5A880] transition-colors cursor-pointer">
              Phòng & Biệt Thự
            </Link>
            <Link href="/#about" className="hover:text-[#C5A880] transition-colors cursor-pointer">
              Về Chúng Tôi
            </Link>
            <Link href="/guest-portal" className="flex items-center gap-1.5 hover:text-[#C5A880] transition-colors cursor-pointer">
              <Calendar className="w-4 h-4" /> Tra cứu đặt phòng
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E463C] text-[#FAF9F6] hover:bg-[#1E463C]/90 transition-all border border-[#1E463C]/20 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin Panel
                  </Link>
                )}
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 hover:text-[#C5A880] transition-colors text-sm font-medium cursor-pointer"
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name} 
                      className="w-8 h-8 rounded-full object-cover border border-[#C5A880]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1E463C]/10 flex items-center justify-center border border-[#1E463C]/20">
                      <UserIcon className="w-4 h-4 text-[#1E463C]" />
                    </div>
                  )}
                  <span className="hidden sm:inline">{user.full_name}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm font-medium hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Đăng Nhập
                </Link>
                <Link 
                  href="/register" 
                  className="px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#C5A880] text-[#FAF9F6] hover:bg-[#b0936e] transition-all hover:shadow-lg hover:shadow-[#C5A880]/15 cursor-pointer"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
            
            {/* Mobile menu trigger */}
            <button className="md:hidden p-2 text-[#1E463C] hover:text-[#C5A880] cursor-pointer">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer sang trọng */}
      <footer className="bg-[#1E463C] text-[#FAF9F6] border-t border-[#FAF9F6]/10 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Cột 1: Giới thiệu */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="font-serif text-3xl font-bold tracking-wide">
                GALOPHY
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#C5A880] uppercase font-medium -mt-1">
                RETREATS
              </span>
            </div>
            <p className="text-sm text-[#FAF9F6]/75 leading-relaxed font-light font-sans">
              Nơi hội tụ giữa thiên nhiên hoang sơ và phong cách sống thượng lưu. Chuỗi homestay eco-luxury độc bản mang lại không gian thư giãn tuyệt hảo nhất cho kỳ nghỉ của bạn.
            </p>
          </div>

          {/* Cột 2: Đường dẫn */}
          <div>
            <h4 className="font-serif text-lg font-bold text-[#C5A880] mb-6 font-sans">Liên Kết Nhanh</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#FAF9F6]/85 font-light font-sans">
              <li><Link href="/" className="hover:text-[#C5A880] transition-colors cursor-pointer">Trang Chủ</Link></li>
              <li><Link href="/#rooms" className="hover:text-[#C5A880] transition-colors cursor-pointer">Phòng & Biệt Thự</Link></li>
              <li><Link href="/guest-portal" className="hover:text-[#C5A880] transition-colors cursor-pointer">Tra Cứu Đặt Phòng</Link></li>
              <li><Link href="/login" className="hover:text-[#C5A880] transition-colors cursor-pointer">Đăng Nhập / Đăng Ký</Link></li>
            </ul>
          </div>

          {/* Cột 3: Chi nhánh */}
          <div>
            <h4 className="font-serif text-lg font-bold text-[#C5A880] mb-6">Chi Nhánh</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#FAF9F6]/85 font-light">
              <li>
                <strong className="font-semibold text-[#FAF9F6]">Đà Lạt:</strong>
                <p className="text-xs text-[#FAF9F6]/70 mt-1">Hồ Tuyền Lâm, Phường 3, Đà Lạt, Lâm Đồng</p>
              </li>
              <li>
                <strong className="font-semibold text-[#FAF9F6]">Nha Trang:</strong>
                <p className="text-xs text-[#FAF9F6]/70 mt-1">Đường Trần Phú, Phường Lộc Thọ, Nha Trang</p>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hotline & Hỗ trợ */}
          <div>
            <h4 className="font-serif text-lg font-bold text-[#C5A880] mb-6">Liên Hệ</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#FAF9F6]/85 font-light">
              <li>Hotline: <span className="font-semibold text-[#C5A880] hover:underline cursor-pointer">1900 8888</span></li>
              <li>Email: contact@galophy.com</li>
              <li>Thời gian nhận phòng: 14:00</li>
              <li>Thời gian trả phòng: 12:00</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[#FAF9F6]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF9F6]/60 font-light gap-4 font-sans">
          <p>© 2026 Galophy Retreats. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#C5A880] transition-colors cursor-pointer">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-[#C5A880] transition-colors cursor-pointer">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
