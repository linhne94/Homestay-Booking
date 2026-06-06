'use client';

import React, { useState } from 'react';
import { Calendar, Users, MapPin, Star, Award, ShieldCheck, Heart, LogOut, CheckCircle2, MessageSquare } from 'lucide-react';
import { createReviewAction } from '@/app/actions/booking';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  deposit_amount: number;
  status: string;
  created_at: string;
  room: {
    room_number: string;
    floor: number;
    room_type: {
      id: string;
      name: string;
      thumbnail_url: string;
      branch: {
        name: string;
        city: string;
      };
    };
  };
  reviews: any[];
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

export default function DashboardClient({
  user,
  bookings,
  loyaltyTransactions,
}: {
  user: any;
  bookings: Booking[];
  loyaltyTransactions: LoyaltyTransaction[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'loyalty'>('bookings');
  
  // States cho modal Review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingClean, setRatingClean] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingLocation, setRatingLocation] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logoutAction();
      router.push('/');
      router.refresh();
    }
  };

  const handleOpenReview = (b: Booking) => {
    setSelectedBooking(b);
    setRatingOverall(5);
    setRatingClean(5);
    setRatingService(5);
    setRatingLocation(5);
    setComment('');
    setErrorMsg('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createReviewAction({
        bookingId: selectedBooking.id,
        userId: user.id,
        ratingOverall,
        ratingCleanliness: ratingClean,
        ratingService,
        ratingLocation,
        comment,
      });

      if (res.success) {
        setShowReviewModal(false);
        alert('Cảm ơn bạn đã viết đánh giá phòng! Bạn được cộng thêm 100 điểm Loyalty!');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trạng thái booking badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHECKED_OUT': return 'bg-zinc-100 text-zinc-800 border-zinc-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Đã đặt cọc';
      case 'PENDING_PAYMENT': return 'Chờ cọc';
      case 'CHECKED_IN': return 'Đang ở';
      case 'CHECKED_OUT': return 'Đã trả phòng';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-[#1E463C]">
      {/* 1. Header Profile & Loyalty Points Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-8 rounded-3xl border border-[#1E463C]/10 shadow-lg mb-12">
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#C5A880]" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1E463C]/5 border border-[#1E463C]/10 flex items-center justify-center font-serif text-3xl font-bold">
              {user.full_name[0]}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-2xl font-bold">{user.full_name}</h2>
            <p className="text-xs text-[#1E463C]/70 font-light">{user.email}</p>
            <button 
              onClick={handleLogout}
              className="text-[10px] uppercase font-bold tracking-widest text-red-600 hover:text-red-700 mt-2 flex items-center gap-1 hover:underline justify-center sm:justify-start"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất tài khoản
            </button>
          </div>
        </div>

        {/* Loyalty Points Card */}
        <div className="bg-[#1E463C] text-[#FAF9F6] p-6 rounded-2xl border border-[#FAF9F6]/10 flex items-center gap-6 relative overflow-hidden shadow-inner">
          <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-[#C5A880]/15 rounded-full blur-xl" />
          <div className="p-3 bg-[#C5A880]/20 rounded-xl text-[#C5A880] border border-[#C5A880]/20 shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[#FAF9F6]/60 font-semibold">Thành viên Galophy Elite</span>
            <span className="text-3xl font-serif font-black text-[#C5A880]">{user.loyalty_points} <span className="text-xs font-sans font-light text-[#FAF9F6]/85">điểm</span></span>
            <span className="text-[9px] text-[#FAF9F6]/75 font-light">Viết đánh giá để nhận 100 điểm thưởng/lần.</span>
          </div>
        </div>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="flex border-b border-[#1E463C]/10 mb-8 gap-6 text-sm font-semibold tracking-wide">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'bookings' ? 'border-[#1E463C] text-[#1E463C]' : 'border-transparent text-[#1E463C]/60 hover:text-[#1E463C]'
          }`}
        >
          Đơn Đặt Phòng Của Tôi ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'loyalty' ? 'border-[#1E463C] text-[#1E463C]' : 'border-transparent text-[#1E463C]/60 hover:text-[#1E463C]'
          }`}
        >
          Lịch Sử Tích Điểm ({loyaltyTransactions.length})
        </button>
      </div>

      {/* 3. Tab Content 1: Bookings List */}
      {activeTab === 'bookings' && (
        <div className="flex flex-col gap-6">
          {bookings.length > 0 ? (
            bookings.map((b) => {
              const checkIn = new Date(b.check_in);
              const checkOut = new Date(b.check_out);
              const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
              const isCheckedOut = b.status === 'CHECKED_OUT';
              const hasReview = b.reviews.length > 0;

              return (
                <div 
                  key={b.id}
                  className="bg-white rounded-3xl border border-[#1E463C]/10 shadow-md p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all duration-300 items-center justify-between"
                >
                  <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto items-center">
                    <img 
                      src={b.room.room_type.thumbnail_url} 
                      alt={b.room.room_type.name} 
                      className="w-24 h-24 object-cover rounded-2xl border border-[#1E463C]/10 shrink-0"
                    />
                    <div className="flex flex-col text-center sm:text-left gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase w-fit mx-auto sm:mx-0 border ${getStatusBadge(b.status)}`}>
                        {getStatusText(b.status)}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-[#1E463C] mt-1.5">{b.room.room_type.name}</h3>
                      <p className="text-[10px] text-[#1E463C]/70 font-light flex items-center justify-center sm:justify-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Số phòng: <strong className="font-semibold text-[#1E463C]">{b.room.room_number}</strong>
                      </p>
                      <p className="text-xs text-[#1E463C]/80 mt-1 font-light flex items-center justify-center sm:justify-start gap-3">
                        <span>📅 {checkIn.toLocaleDateString('vi-VN')} - {checkOut.toLocaleDateString('vi-VN')}</span>
                        <span className="text-[#C5A880] font-semibold">({nights} đêm)</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-[#1E463C]/10 pt-4 md:pt-0 md:pl-8 text-center sm:text-right shrink-0">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#1E463C]/60 tracking-wider">Tổng giá trị</span>
                      <p className="text-xl font-bold text-[#1E463C]">{Number(b.total_price).toLocaleString()} VND</p>
                    </div>

                    {/* Điều kiện viết đánh giá */}
                    {isCheckedOut && !hasReview && (
                      <button
                        onClick={() => handleOpenReview(b)}
                        className="px-5 py-2 rounded-xl bg-[#C5A880] hover:bg-[#1E463C] text-[#FAF9F6] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Viết Đánh Giá
                      </button>
                    )}

                    {isCheckedOut && hasReview && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành đánh giá
                      </span>
                    )}

                    {/* QR Code view */}
                    {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-[#C5A880] tracking-widest bg-[#FAF9F6] border border-[#1E463C]/10 px-3 py-1.5 rounded-lg select-none">
                        <ShieldCheck className="w-3.5 h-3.5" /> QR Code check-in sẵn sàng
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-[#1E463C]/10 shadow-sm text-center">
              <p className="text-xs text-[#1E463C]/50 italic">Bạn chưa có đơn đặt phòng nào. Hãy khám phá ngay các phòng mơ ước!</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab Content 2: Loyalty History */}
      {activeTab === 'loyalty' && (
        <div className="bg-white rounded-3xl border border-[#1E463C]/10 shadow-lg p-6 flex flex-col gap-4">
          <h3 className="font-serif text-lg font-bold text-[#1E463C] border-b border-[#1E463C]/10 pb-3 mb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C5A880]" /> Nhật Ký Biến Động Điểm Thưởng
          </h3>
          {loyaltyTransactions.length > 0 ? (
            <div className="flex flex-col gap-4 text-xs font-light">
              {loyaltyTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-zinc-50 pb-3">
                  <div className="flex flex-col gap-1 text-left">
                    <p className="font-medium text-[#1E463C]">{tx.description}</p>
                    <span className="text-[10px] text-[#1E463C]/55">{new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'EARNED' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'EARNED' ? `+${tx.points}` : `-${tx.points}`} điểm
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#1E463C]/50 italic text-center py-6">Chưa có giao dịch tích điểm nào.</p>
          )}
        </div>
      )}

      {/* 5. Star Review Modal (Dialog kính mờ) */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E463C]/40 backdrop-blur-md p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#1E463C]/10 shadow-2xl p-8 max-w-lg w-full flex flex-col gap-6 relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-[#1E463C] text-sm font-bold"
            >
              ✕
            </button>

            <div className="text-center flex flex-col gap-1 border-b border-[#1E463C]/10 pb-4">
              <h3 className="font-serif text-xl font-bold">Đánh Giá Trải Nghiệm</h3>
              <p className="text-xs text-[#1E463C]/70 font-light">Căn phòng: {selectedBooking.room.room_type.name}</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-5 text-xs">
              {/* Star Rating chung */}
              <div className="flex flex-col gap-2 items-center text-center">
                <span className="font-semibold text-[#1E463C]/80">Trải nghiệm chung của bạn *</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingOverall(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-7 h-7 transition-all ${
                        star <= ratingOverall ? 'fill-[#C5A880] text-[#C5A880] scale-110' : 'text-zinc-200 hover:text-[#C5A880]'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Điểm thành phần */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#1E463C]/5 py-4">
                {/* Sạch sẽ */}
                <div className="flex flex-col gap-1.5 items-center">
                  <span className="font-medium text-[#1E463C]/75">Sạch sẽ</span>
                  <select
                    value={ratingClean}
                    onChange={(e) => setRatingClean(Number(e.target.value))}
                    className="bg-[#FAF9F6] border border-[#1E463C]/10 rounded-lg px-2.5 py-1 text-xs outline-none"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
                {/* Phục vụ */}
                <div className="flex flex-col gap-1.5 items-center sm:border-x sm:border-[#1E463C]/10">
                  <span className="font-medium text-[#1E463C]/75">Dịch vụ</span>
                  <select
                    value={ratingService}
                    onChange={(e) => setRatingService(Number(e.target.value))}
                    className="bg-[#FAF9F6] border border-[#1E463C]/10 rounded-lg px-2.5 py-1 text-xs outline-none"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
                {/* Vị trí */}
                <div className="flex flex-col gap-1.5 items-center">
                  <span className="font-medium text-[#1E463C]/75">Vị trí</span>
                  <select
                    value={ratingLocation}
                    onChange={(e) => setRatingLocation(Number(e.target.value))}
                    className="bg-[#FAF9F6] border border-[#1E463C]/10 rounded-lg px-2.5 py-1 text-xs outline-none"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
              </div>

              {/* Bình luận */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="font-bold uppercase tracking-wider text-[#1E463C]/70">Nhận xét chi tiết</label>
                <textarea
                  placeholder="Hãy chia sẻ trải nghiệm lưu trú của bạn tại bungalow..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#1E463C] hover:bg-[#C5A880] disabled:opacity-50 text-[#FAF9F6] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center"
              >
                {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá & Nhận Điểm Thưởng'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
