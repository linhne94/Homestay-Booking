import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { Plus, Tag, Trash2, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminPromotionsPage() {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Lấy danh sách promotions thực tế của chi nhánh
  const promotions = await prisma.promotion.findMany({
    where: { branch_id: branchId },
    orderBy: { valid_from: 'asc' }
  });

  // Server Action tạo Khuyến mãi mới
  const handleCreatePromotion = async (formData: FormData) => {
    'use server';
    const code = (formData.get('code') as string).toUpperCase().trim();
    const name = formData.get('name') as string;
    const discountPct = formData.get('discountPct') ? Number(formData.get('discountPct')) : null;
    const discountFlat = formData.get('discountFlat') ? Number(formData.get('discountFlat')) : null;
    const maxDiscount = formData.get('maxDiscount') ? Number(formData.get('maxDiscount')) : null;
    const usageLimit = formData.get('usageLimit') ? Number(formData.get('usageLimit')) : null;
    const validFromStr = formData.get('validFrom') as string;
    const validToStr = formData.get('validTo') as string;

    if (!code || !name || !validFromStr || !validToStr) return;

    await prisma.promotion.create({
      data: {
        branch_id: branchId,
        code,
        name,
        discount_pct: discountPct,
        discount_flat: discountFlat,
        max_discount: maxDiscount,
        usage_limit: usageLimit,
        valid_from: new Date(validFromStr),
        valid_to: new Date(validToStr),
      }
    });

    revalidatePath('/admin/promotions');
  };

  // Server Action xóa Khuyến mãi
  const handleDeletePromotion = async (formData: FormData) => {
    'use server';
    const promotionId = formData.get('promotionId') as string;
    await prisma.promotion.delete({
      where: { id: promotionId }
    });

    revalidatePath('/admin/promotions');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* Form Tạo Mã Khuyến Mãi */}
      <div className="lg:col-span-5 bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5 h-fit">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C5A880]" /> Tạo Mã Khuyến Mãi
          </h2>
          <p className="text-[10px] text-[#FAF9F6]/55 font-light leading-relaxed">
            Phát hành các chiến dịch giảm giá, chiết khấu và giới hạn số lượng áp dụng cho chi nhánh
          </p>
        </div>

        <form action={handleCreatePromotion} className="flex flex-col gap-4">
          {/* Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Mã Code (In Hoa, Không Dấu)</label>
            <input 
              type="text"
              name="code"
              required
              placeholder="Ví dụ: SUMMER2026, GALOPHYNEW"
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880] font-bold"
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Tên Chương Trình</label>
            <input 
              type="text"
              name="name"
              required
              placeholder="Ví dụ: Chào Hè Rực Rỡ 15%"
              className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Discount Pct */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Giảm giá (%)</label>
              <input 
                type="number"
                name="discountPct"
                placeholder="15"
                max="100"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
            
            {/* Discount Flat */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Giảm tiền mặt (đ)</label>
              <input 
                type="number"
                name="discountFlat"
                placeholder="200000"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Max Discount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Giảm tối đa (đ)</label>
              <input 
                type="number"
                name="maxDiscount"
                placeholder="500000"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
            
            {/* Usage Limit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Số lượt dùng tối đa</label>
              <input 
                type="number"
                name="usageLimit"
                placeholder="50"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valid From */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Hiệu Lực Từ Ngày</label>
              <input 
                type="date"
                name="validFrom"
                required
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
            
            {/* Valid To */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Đến Hết Ngày</label>
              <input 
                type="date"
                name="validTo"
                required
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-11 bg-[#C5A880] hover:bg-[#b0936e] text-[#0B0C10] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow mt-2 cursor-pointer"
          >
            Phát Hành Chiến Dịch
          </button>
        </form>
      </div>

      {/* Danh sách Khuyến Mãi */}
      <div className="lg:col-span-7 bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C5A880]" /> Danh Sách Mã Đang Hoạt Động
          </h2>
          <p className="text-[10px] text-[#FAF9F6]/55 font-light leading-relaxed">
            Các chương trình khuyến mãi hiện hành tại chi nhánh
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {promotions.length === 0 ? (
            <div className="text-center text-xs text-[#FAF9F6]/40 italic py-16 border border-dashed border-[#232731] rounded-xl">
              Chưa có mã khuyến mãi nào được phát hành.
            </div>
          ) : (
            promotions.map((p) => (
              <div 
                key={p.id} 
                className="bg-[#0B0C10]/40 border border-[#232731] p-4 rounded-xl flex justify-between items-center hover:border-[#C5A880]/20 transition-all"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#FAF9F6] uppercase bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30 px-2 py-0.5 rounded leading-none">{p.code}</span>
                    <span className="text-xs font-bold text-[#FAF9F6] truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {p.discount_pct ? `Giảm ${Number(p.discount_pct)}%` : `Giảm ${Number(p.discount_flat).toLocaleString('vi-VN')}đ`}
                    {p.max_discount && ` (Tối đa ${Number(p.max_discount).toLocaleString('vi-VN')}đ)`}
                  </span>
                  <span className="text-[9px] text-[#FAF9F6]/50 font-light flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]/70" />
                    Hạn dùng: Từ {new Date(p.valid_from).toLocaleDateString('vi-VN')} đến {new Date(p.valid_to).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold block">Giới hạn</span>
                    <span className="text-xs font-bold text-[#FAF9F6]">{p.usage_limit ? `${p.usage_limit} lượt` : 'Vô hạn'}</span>
                  </div>

                  <form action={handleDeletePromotion}>
                    <input type="hidden" name="promotionId" value={p.id} />
                    <button 
                      type="submit"
                      className="p-2 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                      title="Xóa khuyến mãi"
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
