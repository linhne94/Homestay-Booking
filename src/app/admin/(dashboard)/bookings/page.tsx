import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { updateBookingStatusAction } from '@/app/actions/booking';
import { Calendar, User, Phone, Mail, DollarSign, Tag, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminBookingsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Await searchParams as per Next.js App Router requirements
  const params = await props.searchParams;
  const statusFilter = params.status || 'ALL';

  // Lấy danh sách booking thực tế
  const bookings = await prisma.booking.findMany({
    where: {
      room: { room_type: { branch_id: branchId } },
      ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {})
    },
    include: {
      room: {
        select: {
          room_number: true,
          room_type: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const statuses = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đã Check-in', value: 'CHECKED_IN' },
    { label: 'Đã Check-out', value: 'CHECKED_OUT' },
    { label: 'Đã Hủy', value: 'CANCELLED' },
  ];

  // Action cập nhật nhanh trong Server Component
  const handleUpdateStatus = async (formData: FormData) => {
    'use server';
    const bookingId = formData.get('bookingId') as string;
    const newStatus = formData.get('status') as string;
    await updateBookingStatusAction(bookingId, newStatus);
    revalidatePath('/admin/bookings');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#FAF9F6]">Quản Lý Đơn Đặt Phòng</h1>
        <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">Quản lý, duyệt thanh toán, check-in và check-out khách hàng thực tế</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#161920] border border-[#232731] p-1.5 rounded-2xl w-fit">
        {statuses.map((s) => (
          <a
            key={s.value}
            href={`/admin/bookings?status=${s.value}`}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              statusFilter === s.value
                ? 'bg-[#C5A880] text-[#0B0C10] shadow'
                : 'text-[#FAF9F6]/60 hover:text-[#FAF9F6] hover:bg-[#232731]/40'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {bookings.length === 0 ? (
          <div className="bg-[#161920] border border-[#232731] rounded-2xl p-12 text-center text-xs text-[#FAF9F6]/40 col-span-2 italic">
            Không tìm thấy đặt phòng nào khớp bộ lọc.
          </div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#C5A880]/30 transition-all duration-300 relative overflow-hidden group">
              {/* Golden corner decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C5A880]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              {/* Top row: Guest name & Status */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-[#FAF9F6] truncate flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#C5A880] shrink-0" />
                    {b.guest_name || 'Khách hàng thành viên'}
                  </span>
                  <span className="text-[10px] text-[#FAF9F6]/55 truncate leading-none">Mã booking: {b.id}</span>
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
                  b.status === 'CONFIRMED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : b.status === 'CHECKED_IN'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : b.status === 'CHECKED_OUT'
                    ? 'bg-[#232731] text-[#FAF9F6]/60 border-[#232731]'
                    : b.status === 'PENDING_PAYMENT'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {b.status}
                </span>
              </div>

              {/* Guest details */}
              <div className="grid grid-cols-2 gap-4 bg-[#0B0C10]/40 p-4 rounded-xl border border-[#232731]/50 text-xs font-light text-[#FAF9F6]/75">
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#C5A880]/70" /> {b.guest_phone || 'Không cung cấp'}</span>
                  <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-[#C5A880]/70" /> {b.guest_email || 'Không cung cấp'}</span>
                </div>
                <div className="flex flex-col gap-2 border-l border-[#232731] pl-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C5A880]/70" /> {new Date(b.check_in).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-[#C5A880]/70" /> {new Date(b.check_out).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Room & Price Row */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold">Phòng phân phối</span>
                  <span className="font-bold text-[#FAF9F6] mt-0.5">Phòng {b.room.room_number} <span className="font-light text-[#FAF9F6]/60">• {b.room.room_type.name}</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold">Tổng chi phí</span>
                  <span className="font-extrabold text-[#C5A880] text-sm block mt-0.5">{Number(b.total_price).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>

              {/* Action buttons (Server Action Forms) */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#232731]/70">
                {b.status === 'PENDING_PAYMENT' && (
                  <form action={handleUpdateStatus}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="status" value="CONFIRMED" />
                    <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0B0C10] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                      Duyệt thanh toán
                    </button>
                  </form>
                )}

                {b.status === 'CONFIRMED' && (
                  <form action={handleUpdateStatus}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="status" value="CHECKED_IN" />
                    <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-[#0B0C10] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                      Check-in khách
                    </button>
                  </form>
                )}

                {b.status === 'CHECKED_IN' && (
                  <form action={handleUpdateStatus}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="status" value="CHECKED_OUT" />
                    <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0C10] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                      Check-out khách
                    </button>
                  </form>
                )}

                {b.status !== 'CHECKED_OUT' && b.status !== 'CANCELLED' && (
                  <form action={handleUpdateStatus}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="status" value="CANCELLED" />
                    <button type="submit" className="px-4 py-2 bg-red-950/30 text-red-400 hover:bg-red-950/60 border border-red-900/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                      Hủy đặt phòng
                    </button>
                  </form>
                )}

                {/* Additional source metadata */}
                <div className="ml-auto text-[10px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold">
                  Nguồn: {b.source}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
