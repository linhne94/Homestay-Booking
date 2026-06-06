'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('redirectTo', '/admin'); // Đăng nhập admin luôn chuyển hướng về /admin

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.success && res.user) {
        if (res.user.role !== 'ADMIN' && res.user.role !== 'STAFF') {
          setError('Tài khoản của bạn không có quyền truy cập trang quản trị.');
          return;
        }
        router.push('/admin');
        router.refresh();
      } else {
        setError(res.error || 'Đăng nhập thất bại.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center px-6 selection:bg-[#C5A880]/30 antialiased">
      <div className="max-w-md w-full bg-[#161920] rounded-3xl border border-[#232731] shadow-2xl p-8 flex flex-col gap-6 relative">
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FAF9F6]/60 hover:text-[#C5A880] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Về trang chủ
        </Link>

        <div className="text-center flex flex-col gap-1.5 mt-8">
          <div className="flex flex-col mb-2">
            <span className="font-serif text-2xl font-black tracking-wide text-[#FAF9F6]">GALOPHY</span>
            <span className="text-[9px] tracking-[0.25em] text-[#C5A880] uppercase font-bold -mt-1">ADMIN PORTAL</span>
          </div>
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6]">Hệ Thống Quản Trị</h2>
          <p className="text-xs text-[#FAF9F6]/60 font-light">Đăng nhập tài khoản Nhân viên / Quản trị viên để bắt đầu ca làm việc.</p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#FAF9F6]/75 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email Nhân Viên
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="nhanvien@galophy.com"
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
            />
          </div>

          {/* Mật khẩu */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#FAF9F6]/75 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
            />
          </div>

          {/* Nút bấm */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-[#C5A880] hover:bg-[#b0936e] disabled:opacity-55 text-[#0B0C10] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group mt-2 cursor-pointer"
          >
            {isPending ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold pt-2 border-t border-[#232731]/50">
          <Shield className="w-3.5 h-3.5 text-[#C5A880]" /> Bảng điều khiển bảo mật cao
        </div>
      </div>
    </div>
  );
}
