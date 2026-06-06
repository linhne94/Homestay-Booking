import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { Bed, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminTimelinePage() {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Lấy các ngày trong tháng hiện tại (mặc định tháng 5/2026 cho khớp với local time)
  const currentYear = 2026;
  const currentMonth = 4; // Tháng 5 (0-indexed)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Lấy danh sách tất cả các phòng của chi nhánh
  const rooms = await prisma.room.findMany({
    where: { room_type: { branch_id: branchId } },
    include: {
      room_type: { select: { name: true } },
      bookings: {
        where: {
          status: {
            in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'PENDING_PAYMENT']
          },
          check_in: {
            gte: new Date(currentYear, currentMonth, 1),
          },
          check_out: {
            lte: new Date(currentYear, currentMonth, daysInMonth + 1),
          }
        }
      }
    },
    orderBy: { room_number: 'asc' }
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#FAF9F6]">Sơ đồ Lịch Biểu Timeline</h1>
          <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">Sơ đồ Gantt trực quan trạng thái đặt phòng theo tháng</p>
        </div>
        <div className="flex items-center gap-3 bg-[#161920] border border-[#232731] p-1.5 rounded-xl">
          <button className="p-2 hover:bg-[#232731] rounded-lg text-[#FAF9F6]/60 hover:text-[#FAF9F6] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#FAF9F6] px-2">Tháng 05 / 2026</span>
          <button className="p-2 hover:bg-[#232731] rounded-lg text-[#FAF9F6]/60 hover:text-[#FAF9F6] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend / Chú thích */}
      <div className="flex flex-wrap items-center gap-4 bg-[#161920] border border-[#232731] px-5 py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest text-[#FAF9F6]/60">
        <span className="text-[#C5A880] mr-2">Trạng thái đặt phòng:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500 rounded border border-emerald-400/25"></div>
          <span>Đã xác nhận</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded border border-blue-400/25"></div>
          <span>Đã nhận phòng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-500 rounded border border-amber-400/25"></div>
          <span>Chờ thanh toán</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#232731] rounded"></div>
          <span>Đã trả phòng</span>
        </div>
      </div>

      {/* Timeline Board */}
      <div className="bg-[#161920] border border-[#232731] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#232731] scrollbar-track-[#161920]">
          <div className="min-w-[1200px]">
            {/* Header row with dates */}
            <div className="grid grid-cols-12 border-b border-[#232731]">
              <div className="col-span-3 p-4 border-r border-[#232731] font-bold text-xs uppercase tracking-wider text-[#FAF9F6]/50 bg-[#0B0C10]/40 flex items-center gap-2">
                <Bed className="w-4 h-4 text-[#C5A880]" /> Phòng &amp; Loại phòng
              </div>
              <div className="col-span-9 grid grid-cols-31 bg-[#0B0C10]/15">
                {days.map((day) => (
                  <div 
                    key={day} 
                    className="p-2 border-r border-[#232731] text-center text-[10px] font-bold text-[#FAF9F6]/60 flex flex-col items-center justify-center gap-0.5 min-h-[50px] last:border-0"
                  >
                    <span>{day}</span>
                    <span className="text-[7px] text-[#FAF9F6]/30 uppercase">T{((day % 7) + 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-[#232731]">
              {rooms.map((room) => (
                <div key={room.id} className="grid grid-cols-12 group hover:bg-[#0B0C10]/10 transition-colors">
                  {/* Room details */}
                  <div className="col-span-3 p-4 border-r border-[#232731] bg-[#0B0C10]/20 flex flex-col gap-1.5 justify-center min-h-[75px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#C5A880]">Phòng {room.room_number}</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        room.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          : room.status === 'CLEANING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                          : 'bg-red-500/10 text-red-400 border border-red-500/15'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#FAF9F6]/55 truncate leading-none">{room.room_type.name}</span>
                  </div>

                  {/* Calendar Grid cells */}
                  <div className="col-span-9 grid grid-cols-31 relative bg-[#0B0C10]/5">
                    {/* Render grid cell borders */}
                    {days.map((day) => {
                      // Find if room has booking on this day
                      const booking = room.bookings.find((b) => {
                        const inDate = new Date(b.check_in).getDate();
                        const outDate = new Date(b.check_out).getDate();
                        return day >= inDate && day < outDate;
                      });

                      let cellColor = '';
                      let hoverTitle = 'Phòng trống';
                      if (booking) {
                        if (booking.status === 'CONFIRMED') {
                          cellColor = 'bg-emerald-500 border-t border-b border-emerald-400/30';
                        } else if (booking.status === 'CHECKED_IN') {
                          cellColor = 'bg-blue-500 border-t border-b border-blue-400/30';
                        } else if (booking.status === 'PENDING_PAYMENT') {
                          cellColor = 'bg-amber-500 border-t border-b border-amber-400/30';
                        } else {
                          cellColor = 'bg-[#232731] border-t border-b border-[#232731] opacity-60';
                        }
                        hoverTitle = `${booking.guest_name || 'Khách hàng'} (${booking.status})`;
                      }

                      return (
                        <div 
                          key={day} 
                          title={hoverTitle}
                          className={`border-r border-[#232731]/40 last:border-0 min-h-[75px] transition-all flex items-center justify-center relative cursor-pointer group/cell ${cellColor}`}
                        >
                          {booking && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[8px] font-black text-[#0B0C10] uppercase tracking-wider select-none truncate px-1">
                                {booking.guest_name?.split(' ').pop()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
