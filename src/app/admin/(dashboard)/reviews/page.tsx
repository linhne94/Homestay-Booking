import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { Star, MessageSquare, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminReviewsPage() {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Lấy danh sách review thực tế của chi nhánh
  const reviews = await prisma.review.findMany({
    where: { booking: { room: { room_type: { branch_id: branchId } } } },
    include: {
      user: { select: { full_name: true, email: true } },
      booking: {
        select: {
          room: { select: { room_number: true, room_type: { select: { name: true } } } }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  // Server Action ẩn hiện Review
  const handleToggleReviewVisibility = async (formData: FormData) => {
    'use server';
    const reviewId = formData.get('reviewId') as string;
    const isVisible = formData.get('isVisible') === 'true';

    await prisma.review.update({
      where: { id: reviewId },
      data: { is_visible: !isVisible },
    });

    revalidatePath('/admin/reviews');
  };

  // Server Action trả lời Review
  const handleReplyToReview = async (formData: FormData) => {
    'use server';
    const reviewId = formData.get('reviewId') as string;
    const replyText = formData.get('replyText') as string;

    if (!reviewId || !replyText) return;

    await prisma.review.update({
      where: { id: reviewId },
      data: { staff_reply: replyText },
    });

    revalidatePath('/admin/reviews');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#FAF9F6]">Quản Lý Đánh Giá</h1>
        <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">Quản lý phản hồi khách hàng, điều chỉnh ẩn hiện và viết phản hồi chính thức từ Homestay</p>
      </div>

      {/* Grid reviews */}
      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <div className="bg-[#161920] border border-[#232731] rounded-2xl p-12 text-center text-xs text-[#FAF9F6]/40 italic">
            Chưa có đánh giá nào của khách hàng được tạo.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#C5A880]/20 transition-all duration-300 relative">
              
              {/* Top Row: User info & rating details */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-[#FAF9F6] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#C5A880] shrink-0" />
                    {rev.user.full_name}
                  </span>
                  <span className="text-[10px] text-[#FAF9F6]/55 font-light">
                    Đặt phòng {rev.booking.room.room_type.name} (Phòng {rev.booking.room.room_number})
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-[#C5A880]/15 text-[#C5A880] px-2.5 py-1 rounded-lg border border-[#C5A880]/30 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-[#C5A880]" /> {rev.rating_overall} / 5
                  </div>
                  <span className="text-[9px] text-[#FAF9F6]/40 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Sub-ratings details */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#0B0C10]/40 px-4 py-2.5 rounded-xl border border-[#232731]/50 text-[10px] uppercase font-bold tracking-widest text-[#FAF9F6]/60 w-fit">
                <span>Sạch sẽ: <strong className="text-[#C5A880]">{rev.rating_cleanliness}</strong></span>
                <span>•</span>
                <span>Dịch vụ: <strong className="text-[#C5A880]">{rev.rating_service}</strong></span>
                <span>•</span>
                <span>Vị trí: <strong className="text-[#C5A880]">{rev.rating_location}</strong></span>
              </div>

              {/* Comments from Guest */}
              <div className="text-xs font-light text-[#FAF9F6]/85 bg-[#0B0C10]/20 p-4 rounded-xl border border-[#232731]/30 leading-relaxed italic">
                &ldquo;{rev.comment || 'Khách hàng không viết bình luận.'}&rdquo;
              </div>

              {/* Staff Response */}
              {rev.staff_reply && (
                <div className="text-xs font-light text-[#FAF9F6]/80 bg-[#C5A880]/5 p-4 rounded-xl border border-[#C5A880]/20 leading-relaxed ml-8 relative">
                  <div className="absolute top-4 left-[-16px] w-4 h-4 border-l border-b border-[#C5A880]/20"></div>
                  <strong className="text-[#C5A880] font-bold block mb-1">Phản hồi của Galophy:</strong>
                  {rev.staff_reply}
                </div>
              )}

              {/* Action Buttons row */}
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#232731]/70 mt-1">
                
                {/* Reply Form */}
                <form action={handleReplyToReview} className="flex gap-2 flex-grow max-w-lg">
                  <input type="hidden" name="reviewId" value={rev.id} />
                  <input 
                    type="text" 
                    name="replyText" 
                    required 
                    placeholder="Viết lời phản hồi chính thức của Homestay..." 
                    className="flex-grow bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-[#C5A880] text-[#0B0C10] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:bg-[#b0936e]"
                  >
                    Trả lời
                  </button>
                </form>

                {/* Hide / Show toggle */}
                <form action={handleToggleReviewVisibility} className="ml-auto shrink-0">
                  <input type="hidden" name="reviewId" value={rev.id} />
                  <input type="hidden" name="isVisible" value={String(rev.is_visible)} />
                  <button 
                    type="submit" 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer border ${
                      rev.is_visible
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    }`}
                  >
                    {rev.is_visible ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Hiển thị trên Web
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Đang ẩn
                      </>
                    )}
                  </button>
                </form>

              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
