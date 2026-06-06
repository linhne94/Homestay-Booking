import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users, User, Shield, CheckCircle2, Phone, Mail, Calendar } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminStaffPage() {
  const staff = await getSessionStaff();

  // Phân quyền: Chỉ cho phép ADMIN truy cập
  if (!staff || staff.staff_profile.role !== 'ADMIN') {
    redirect('/admin');
  }

  const branchId = staff.staff_profile.branch_id;

  // Lấy danh sách tất cả các nhân viên thực tế trong chi nhánh này
  const staffs = await prisma.staff.findMany({
    where: { branch_id: branchId },
    include: {
      user: {
        select: {
          full_name: true,
          email: true,
          phone: true,
          is_active: true
        }
      }
    },
    orderBy: { created_at: 'asc' }
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#FAF9F6]">Nhân Sự &amp; Phân Quyền</h1>
        <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">Danh sách các nhân viên đang có quyền điều hành tại chi nhánh</p>
      </div>

      {/* Grid staffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffs.map((st) => (
          <div key={st.id} className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#C5A880]/30 transition-all duration-300 relative group">
            
            {/* Top row: Role Icon & Name */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF9F6]/5 flex items-center justify-center border border-[#FAF9F6]/10">
                  <User className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#FAF9F6] truncate">{st.user.full_name}</span>
                  <span className="text-[10px] text-[#FAF9F6]/50 truncate font-light mt-0.5">Mã NV: {st.id.slice(0, 8)}</span>
                </div>
              </div>

              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                st.role === 'ADMIN'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : st.role === 'RECEPTIONIST'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {st.role}
              </span>
            </div>

            {/* Contacts details */}
            <div className="flex flex-col gap-2.5 bg-[#0B0C10]/40 p-4 rounded-xl border border-[#232731]/50 text-xs font-light text-[#FAF9F6]/75">
              <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> <span className="truncate">{st.user.email}</span></span>
              <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> {st.user.phone || 'Không cung cấp'}</span>
              <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> Gia nhập: {new Date(st.created_at).toLocaleDateString('vi-VN')}</span>
            </div>

            {/* Footer status indicator */}
            <div className="flex justify-between items-center pt-3 border-t border-[#232731]/70 text-xs text-[#FAF9F6]/55">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[#C5A880]" /> Quyền điều hành chi nhánh</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đang hoạt động
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
