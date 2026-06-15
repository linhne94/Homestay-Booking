'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.success) {
        // Đăng nhập thành công, chuyển hướng
        router.push(res.redirectTo || '/');
        router.refresh();
      } else {
        setError(res.error || 'Đăng nhập thất bại.');
      }
    });
  };

  return (
    <div className="min-h-[75vh] grid grid-cols-1 md:grid-cols-2">
      {/* Left side: Decorative */}
      <div className="hidden md:flex flex-col justify-between bg-bg-section p-16 text-wood-dark border-r border-wood-light/30">
        <div>
          <h1 className="font-serif text-6xl font-bold tracking-wide">Lơ Mơ</h1>
          <p className="text-primary-light text-lg mt-3 font-normal">Một chốn lơ mơ giữa lòng Đà Lạt</p>
        </div>
        <div className="text-wood-light text-xs font-light leading-relaxed">
          <p className="font-semibold text-wood-dark">Lơ Mơ Homestay Đà Lạt</p>
          <p className="mt-1">Địa chỉ: 22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt</p>
          <p>Hotline / Zalo: 036.757.3242</p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex items-center justify-center bg-bg-main py-12 px-6">
        <div className="w-full max-w-[380px] flex flex-col gap-6">
          <Link 
            href="/" 
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
          </Link>

          <div className="flex flex-col gap-1.5 mt-2">
            <h2 className="font-serif text-2xl font-semibold text-wood-dark">Đăng nhập</h2>
            <p className="text-sm text-primary-light">Chào mừng bạn trở lại 🌿</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {/* Email */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-sm font-medium text-wood-dark mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary-light" /> Địa chỉ Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="yourmail@gmail.com"
                className="w-full bg-white border border-wood-light rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-wood-dark placeholder-wood-light/50"
              />
            </div>

            {/* Mật khẩu */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-sm font-medium text-wood-dark mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary-light" /> Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-white border border-wood-light rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-wood-dark placeholder-wood-light/50"
              />
            </div>

            {/* Nút bấm */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group mt-2 cursor-pointer"
            >
              {isPending ? 'Đang xác thực...' : 'Đăng nhập'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center text-xs text-wood-dark/70 font-light border-t border-wood-light/35 pt-4 mt-2">
            Chưa có tài khoản thành viên?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline cursor-pointer">
              Đăng ký ngay
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-primary-light font-semibold mt-[-8px]">
            <Shield className="w-3.5 h-3.5 text-primary-light" /> Hệ thống bảo mật 2 lớp SSL
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto my-20 px-6 text-center text-xs text-[#1E463C]/60 font-light">
        Đang tải trang đăng nhập...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
