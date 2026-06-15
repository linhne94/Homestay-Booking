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
    <div className="flex flex-col min-h-screen bg-bg-main text-wood-dark font-sans selection:bg-primary-light/30">
      {/* Navbar Lơ Mơ Homestay */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-main/90 border-b border-wood-light">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link href="/" className="flex flex-col cursor-pointer">
            <span className="font-serif text-xl font-semibold tracking-wide text-wood-dark hover:opacity-90 transition-opacity">
              Lơ Mơ
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/#rooms" className="text-primary hover:text-primary-light transition-colors cursor-pointer">
              Phòng & Không gian
            </Link>
            <Link href="/#about" className="text-primary hover:text-primary-light transition-colors cursor-pointer">
              Vị trí
            </Link>
            <Link href="/guest-portal" className="text-primary hover:text-primary-light transition-colors cursor-pointer">
              Tra cứu đặt phòng
            </Link>
            <Link href="#contact" className="text-primary hover:text-primary-light transition-colors cursor-pointer">
              Liên hệ
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-light transition-all border border-wood-light cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin Panel
                  </Link>
                )}
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 hover:text-primary-light transition-colors text-sm font-medium cursor-pointer"
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name} 
                      className="w-8 h-8 rounded-full object-cover border border-wood-light"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="hidden sm:inline">{user.full_name}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm font-medium border border-wood-light text-wood-dark rounded-full px-4 py-1.5 hover:bg-bg-section transition-colors cursor-pointer"
                >
                  Đăng Nhập
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-medium border border-wood-light text-wood-dark rounded-full px-4 py-1.5 hover:bg-bg-section transition-colors cursor-pointer"
                >
                  Đăng Ký
                </Link>
              </div>
            )}

            {/* CTA Button "Đặt phòng" */}
            <Link 
              href="/#rooms" 
              className="bg-primary hover:bg-primary-light text-white rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              Đặt phòng
            </Link>
            
            {/* Mobile menu trigger */}
            <button className="md:hidden p-2 text-primary hover:text-primary-light cursor-pointer">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Lơ Mơ */}
      <footer id="contact" className="bg-dark text-bg-main/90 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Cột 1: Giới thiệu */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-2xl font-semibold text-wood-light">
              Lơ Mơ Homestay
            </span>
            <p className="text-sm text-bg-main/70 leading-relaxed font-sans font-light">
              Một chốn lơ mơ giữa lòng Đà Lạt. Nơi bạn tìm thấy sự bình yên, tiếng thông reo và những góc nhỏ mộc mạc đậm chất Đà Lạt.
            </p>
            <p className="text-xs text-wood-light/80 mt-1">
              Địa chỉ: 22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Thành phố Đà Lạt, Lâm Đồng
            </p>
          </div>

          {/* Cột 2: Đường dẫn nhanh */}
          <div>
            <h4 className="text-wood-light text-base font-semibold mb-6">Đường dẫn nhanh</h4>
            <ul className="flex flex-col gap-3 text-sm text-primary-light font-light">
              <li><Link href="/#rooms" className="hover:underline transition-colors cursor-pointer">Phòng & Không gian</Link></li>
              <li><Link href="/#about" className="hover:underline transition-colors cursor-pointer">Vị trí</Link></li>
              <li><Link href="/guest-portal" className="hover:underline transition-colors cursor-pointer">Tra cứu đặt phòng</Link></li>
              <li><Link href="/login" className="hover:underline transition-colors cursor-pointer">Đăng nhập / Đăng ký</Link></li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h4 className="text-wood-light text-base font-semibold mb-6">Liên hệ với Mơ</h4>
            <ul className="flex flex-col gap-3 text-sm text-bg-main/80 font-light">
              <li>Hotline / Zalo: <span className="font-medium text-wood-light hover:underline cursor-pointer">036.757.3242</span></li>
              <li>Instagram: <a href="https://instagram.com/lomohomestay.dalat" target="_blank" rel="noopener noreferrer" className="font-medium text-wood-light hover:underline cursor-pointer">@lomohomestay.dalat</a></li>
              <li>Giờ nhận phòng: 14:00</li>
              <li>Giờ trả phòng: 12:00</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-bg-main/10 flex flex-col sm:flex-row items-center justify-between text-sm text-[#888] font-light gap-4">
          <p>© 2026 Lơ Mơ Homestay · Đà Lạt</p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-wood-light transition-colors cursor-pointer">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-wood-light transition-colors cursor-pointer">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
