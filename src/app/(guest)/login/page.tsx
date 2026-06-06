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
    <div className="max-w-md mx-auto my-20 px-6">
      <div className="bg-white rounded-3xl border border-[#1E463C]/10 shadow-2xl p-8 flex flex-col gap-6 relative">
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/60 hover:text-[#C5A880] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
        </Link>

        <div className="text-center flex flex-col gap-1.5 mt-8">
          <div className="flex flex-col mb-2">
            <span className="font-serif text-2xl font-black tracking-wide">GALOPHY</span>
            <span className="text-[9px] tracking-[0.25em] text-[#C5A880] uppercase font-bold -mt-1">RETREATS</span>
          </div>
          <h2 className="font-serif text-xl font-bold">Chào Mừng Trở Lại</h2>
          <p className="text-xs text-[#1E463C]/70 font-light">Đăng nhập tài khoản thành viên để quản lý kỳ nghỉ &amp; tích luỹ điểm thưởng.</p>
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Địa Chỉ Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="yourmail@gmail.com"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Mật khẩu */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Nút bấm */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-[#1E463C] hover:bg-[#C5A880] disabled:opacity-55 text-[#FAF9F6] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group mt-2 cursor-pointer"
          >
            {isPending ? 'Đang xác thực...' : 'Đăng Nhập'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center text-xs text-[#1E463C]/70 font-light border-t border-[#1E463C]/5 pt-4 mt-2">
          Chưa có tài khoản thành viên?{' '}
          <Link href="/register" className="text-[#C5A880] font-semibold hover:underline cursor-pointer">
            Đăng ký ngay
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#1E463C]/50 uppercase tracking-widest font-semibold mt-[-8px]">
          <Shield className="w-3 h-3 text-[#C5A880]" /> Hệ thống bảo mật 2 lớp SSL
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
