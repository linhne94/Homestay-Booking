import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { Calendar, Tag, Trash2, Plus, DollarSign, ListCollapse } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminPricingPage() {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Lấy các loại phòng trong chi nhánh
  const roomTypes = await prisma.roomType.findMany({
    where: { branch_id: branchId },
    select: { id: true, name: true, base_price: true }
  });

  // Lấy danh sách các giá đặc biệt ngày lễ (PriceOverride) đang có hiệu lực
  const overrides = await prisma.priceOverride.findMany({
    where: { room_type: { branch_id: branchId } },
    include: {
      room_type: { select: { name: true, base_price: true } }
    },
    orderBy: { date_from: 'asc' }
  });

  // Server Action tạo PriceOverride mới
  const handleCreateOverride = async (formData: FormData) => {
    'use server';
    const roomTypeId = formData.get('roomTypeId') as string;
    const dateFromStr = formData.get('dateFrom') as string;
    const dateToStr = formData.get('dateTo') as string;
    const customPrice = Number(formData.get('price'));
    const reason = formData.get('reason') as string;

    if (!roomTypeId || !dateFromStr || !dateToStr || !customPrice || !reason) {
      return;
    }

    await prisma.priceOverride.create({
      data: {
        room_type_id: roomTypeId,
        date_from: new Date(dateFromStr),
        date_to: new Date(dateToStr),
        price: customPrice,
        reason,
      }
    });

    revalidatePath('/admin/pricing');
  };

  // Server Action xóa PriceOverride
  const handleDeleteOverride = async (formData: FormData) => {
    'use server';
    const overrideId = formData.get('overrideId') as string;
    await prisma.priceOverride.delete({
      where: { id: overrideId }
    });

    revalidatePath('/admin/pricing');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* Form Thiết Lập Giá Đặc Biệt */}
      <div className="lg:col-span-5 bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5 h-fit">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C5A880]" /> Thiết Lập Giá Lễ/Tết
          </h2>
          <p className="text-[10px] text-[#FAF9F6]/55 font-light leading-relaxed">
            Thiết lập giá ghi đè (Price Override) tự động áp dụng cho một dải ngày cụ thể (Ví dụ: 30/4 - 1/5, Quốc khánh...)
          </p>
        </div>

        <form action={handleCreateOverride} className="flex flex-col gap-4">
          
          {/* Room Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Loại Phòng Áp Dụng</label>
            <select 
              name="roomTypeId"
              required
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880] cursor-pointer"
            >
              <option value="">Chọn loại phòng...</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} (Base: {Number(rt.base_price).toLocaleString('vi-VN')}đ)</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Từ Ngày</label>
            <input 
              type="date"
              name="dateFrom"
              required
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Đến Ngày (Bao gồm)</label>
            <input 
              type="date"
              name="dateTo"
              required
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
            />
          </div>

          {/* Custom Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Mức Giá Mới (VNĐ/đêm)</label>
            <div className="relative">
              <input 
                type="number"
                name="price"
                required
                placeholder="2500000"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl pl-10 pr-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
              <DollarSign className="w-4 h-4 text-[#C5A880] absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Dịp/Lý Do Áp Dụng</label>
            <input 
              type="text"
              name="reason"
              required
              placeholder="Ví dụ: Lễ Quốc Khánh 2/9, Cao điểm hè..."
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
            />
          </div>

          <button 
            type="submit"
            className="w-full h-11 bg-[#C5A880] hover:bg-[#b0936e] text-[#0B0C10] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow mt-2 cursor-pointer"
          >
            Kích Hoạt Giá Ghi Đè
          </button>
        </form>
      </div>

      {/* Danh sách PriceOverrides đang có hiệu lực */}
      <div className="lg:col-span-7 bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
            <ListCollapse className="w-5 h-5 text-[#C5A880]" /> Danh Sách Lịch Giá Đặc Biệt
          </h2>
          <p className="text-[10px] text-[#FAF9F6]/55 font-light leading-relaxed">
            Danh sách các cấu hình giá chênh lệch đang được áp dụng tự động cho các ngày lễ
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {overrides.length === 0 ? (
            <div className="text-center text-xs text-[#FAF9F6]/40 italic py-16 border border-dashed border-[#232731] rounded-xl">
              Chưa có thiết lập giá chênh lệch nào được thiết lập.
            </div>
          ) : (
            overrides.map((ov) => (
              <div 
                key={ov.id} 
                className="bg-[#0B0C10]/40 border border-[#232731] p-4 rounded-xl flex justify-between items-center hover:border-[#C5A880]/20 transition-all"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-[#FAF9F6] truncate">{ov.room_type.name}</span>
                  <span className="text-[10px] text-[#C5A880] font-semibold">{ov.reason}</span>
                  <span className="text-[9px] text-[#FAF9F6]/50 font-light flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]/70" />
                    Từ {new Date(ov.date_from).toLocaleDateString('vi-VN')} đến {new Date(ov.date_to).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold block">Giá áp dụng</span>
                    <span className="text-xs font-bold text-amber-400">{Number(ov.price).toLocaleString('vi-VN')}đ</span>
                  </div>

                  <form action={handleDeleteOverride}>
                    <input type="hidden" name="overrideId" value={ov.id} />
                    <button 
                      type="submit"
                      className="p-2 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                      title="Gỡ bỏ ghi đè giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
