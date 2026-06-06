'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    startTransition(async () => {
      const res = await registerAction(formData);
      if (res.success) {
        // Đăng ký thành công, chuyển hướng về trang chủ hoặc dashboard
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'Đăng ký tài khoản thất bại.');
      }
    });
  };

  return (
    <div className="max-w-md mx-auto my-16 px-6">
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
          <h2 className="font-serif text-xl font-bold">Đăng Ký Thành Viên</h2>
          <p className="text-xs text-[#1E463C]/70 font-light">Đăng ký để nhận ngay ưu đãi giảm 10% cho kỳ nghỉ đầu tiên và tích điểm đổi đêm nghỉ miễn phí.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Họ tên */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C5A880]" /> Họ &amp; Tên *
            </label>
            <input
              type="text"
              name="fullName"
              required
              placeholder="Nguyễn Văn A"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Địa Chỉ Email *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="yourmail@gmail.com"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="0912345678"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Mật khẩu */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu *
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#1E463C]"
            />
          </div>

          {/* Nhập lại mật khẩu */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Nhập Lại Mật Khẩu *
            </label>
            <input
              type="password"
              name="confirmPassword"
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
            {isPending ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center text-xs text-[#1E463C]/70 font-light border-t border-[#1E463C]/5 pt-4 mt-2">
          Đã có tài khoản thành viên?{' '}
          <Link href="/login" className="text-[#C5A880] font-semibold hover:underline cursor-pointer">
            Đăng nhập ngay
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#1E463C]/50 uppercase tracking-widest font-semibold mt-[-8px]">
          <Shield className="w-3 h-3 text-[#C5A880]" /> Dữ liệu được bảo mật chuẩn SHA-256
        </div>
      </div>
    </div>
  );
}
