'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, Calendar, Users, Shield, ArrowRight, Tag, Percent, Sparkles } from 'lucide-react';
import { createBookingAction } from '@/app/actions/booking';

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  thumbnail_url: string;
  branch: {
    name: string;
    city: string;
  };
}

export default function CheckoutClient({
  roomType,
  checkInStr,
  checkOutStr,
  guestsCount,
  initialPricing,
  user,
}: {
  roomType: RoomType;
  checkInStr: string;
  checkOutStr: string;
  guestsCount: number;
  initialPricing: any;
  user: any | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY'>('VNPAY');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pricing state
  const [pricing, setPricing] = useState(initialPricing);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    setIsLoading(true);

    try {
      // Gọi api tính giá động có mã promo
      const checkIn = new Date(checkInStr);
      const checkOut = new Date(checkOutStr);
      
      const res = await fetch(`/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: roomType.id,
          checkInStr,
          checkOutStr,
          promoCode,
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.promoAppliedCode) {
          setPricing(result.data);
          setPromoApplied(result.data.promoAppliedCode);
          setPromoError('');
        } else {
          setPromoError('Mã khuyến mãi không hợp lệ hoặc không đủ điều kiện.');
        }
      } else {
        setPromoError(result.error || 'Mã không đúng.');
      }
    } catch {
      setPromoError('Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!fullName || !email || !phone) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email và số điện thoại liên hệ.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Tạo đặt phòng qua Server Action bảo mật
      const res = await createBookingAction({
        roomTypeId: roomType.id,
        checkInStr,
        checkOutStr,
        numGuests: guestsCount,
        userId: user?.id,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        specialRequests,
        promoCode: promoApplied || undefined,
      });

      if (!res.success || !res.booking) {
        setErrorMessage(res.error || 'Đặt phòng thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      const bookingId = res.booking.id;
      const guestToken = res.guestToken;

      // 2. Gọi API để sinh URL thanh toán Sandbox tương ứng với cổng thanh toán đã chọn
      const payRes = await fetch(`/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          method: paymentMethod,
          guestToken,
        }),
      });

      const payData = await payRes.json();

      if (payData.success && payData.paymentUrl) {
        // Chuyển hướng khách sang Sandbox Gateway Momo / VNPAY
        window.location.href = payData.paymentUrl;
      } else {
        // Nếu cổng thanh toán lỗi, chuyển sang trang kết quả đặt phòng kèm cảnh báo thanh toán sau
        router.push(`/checkout/success?bookingId=${bookingId}${guestToken ? `&token=${guestToken}` : ''}&paymentStatus=pending`);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi hệ thống trong lúc thanh toán: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-[#1E463C]">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-8">Thông Tin Đặt Phòng</h1>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 text-xs font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Grid: 7 columns Form & 5 columns Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Form điền thông tin (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Section 1: Thông tin liên hệ */}
          <div className="bg-white p-8 rounded-3xl border border-[#1E463C]/10 shadow-sm flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#C5A880]/15 text-[#C5A880] text-xs font-bold flex items-center justify-center">1</span> 
              Thông Tin Khách Hàng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70">Họ &amp; Tên Khách Hàng *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70">Địa Chỉ Email *</label>
                <input
                  type="email"
                  placeholder="contact@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70">Số Điện Thoại *</label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E463C]/70">Yêu cầu đặc biệt (Không bắt buộc)</label>
                <textarea
                  placeholder="Mô tả các yêu cầu của bạn, ví dụ: check-in trễ, nệm phụ, ..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FAF9F6] border border-[#1E463C]/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chọn phương thức thanh toán */}
          <div className="bg-white p-8 rounded-3xl border border-[#1E463C]/10 shadow-sm flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#C5A880]/15 text-[#C5A880] text-xs font-bold flex items-center justify-center">2</span> 
              Phương Thức Đặt Cọc
            </h3>
            
            <p className="text-xs text-[#1E463C]/70 font-light leading-relaxed -mt-3">
              Để hoàn tất đặt lịch, quý khách vui lòng đặt cọc tối thiểu <strong className="font-semibold text-[#1E463C]">{pricing.depositRate * 100}%</strong> tổng số tiền đặt phòng thông qua các cổng thanh toán an toàn dưới đây.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Momo */}
              <button
                onClick={() => setPaymentMethod('MOMO')}
                className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  paymentMethod === 'MOMO'
                    ? 'border-[#1E463C] bg-[#1E463C]/5 shadow-sm'
                    : 'border-[#1E463C]/10 bg-white hover:border-[#1E463C]/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1E463C]">Ví MoMo Sandbox</h4>
                  <p className="text-[10px] text-[#1E463C]/65 font-light mt-1">
                    Thanh toán nhanh chóng bằng ví điện tử hoặc quét mã QR.
                  </p>
                </div>
              </button>

              {/* VNPAY */}
              <button
                onClick={() => setPaymentMethod('VNPAY')}
                className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  paymentMethod === 'VNPAY'
                    ? 'border-[#1E463C] bg-[#1E463C]/5 shadow-sm'
                    : 'border-[#1E463C]/10 bg-white hover:border-[#1E463C]/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1E463C]">Cổng VNPAY Sandbox</h4>
                  <p className="text-[10px] text-[#1E463C]/65 font-light mt-1">
                    Hỗ trợ ATM nội địa, Thẻ quốc tế Visa/Mastercard hoặc ứng dụng Ngân hàng.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Invoice hóa đơn (5 columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit flex flex-col gap-6">
          <div className="bg-[#1E463C] text-[#FAF9F6] rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            {/* Tóm tắt phòng */}
            <div className="flex gap-4 border-b border-[#FAF9F6]/10 pb-6">
              <img 
                src={roomType.thumbnail_url} 
                alt={roomType.name} 
                className="w-20 h-20 object-cover rounded-2xl border border-[#FAF9F6]/10 shrink-0"
              />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880]">Chi nhánh {roomType.branch.city}</span>
                <h3 className="font-serif font-bold text-lg text-[#FAF9F6]">{roomType.name}</h3>
              </div>
            </div>

            {/* Chi tiết lịch */}
            <div className="grid grid-cols-2 gap-4 text-xs font-light">
              <div className="flex flex-col gap-1 border-r border-[#FAF9F6]/10">
                <span className="text-[9px] uppercase tracking-wider text-[#FAF9F6]/60 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Check-In</span>
                <strong className="font-semibold text-sm">{new Date(checkInStr).toLocaleDateString('vi-VN')}</strong>
              </div>
              <div className="flex flex-col gap-1 pl-2">
                <span className="text-[9px] uppercase tracking-wider text-[#FAF9F6]/60 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Check-Out</span>
                <strong className="font-semibold text-sm">{new Date(checkOutStr).toLocaleDateString('vi-VN')}</strong>
              </div>
              <div className="col-span-2 flex items-center gap-4 border-t border-[#FAF9F6]/10 pt-4 mt-2">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#C5A880]" /> {guestsCount} khách</span>
                <span className="text-[#C5A880] font-semibold flex items-center gap-1"><Sparkles className="w-4 h-4" /> {pricing.nightsCount} đêm nghỉ</span>
              </div>
            </div>

            {/* Khuyến mãi input */}
            <div className="border-t border-[#FAF9F6]/10 pt-6">
              <label className="text-[9px] uppercase tracking-wider text-[#FAF9F6]/60 font-semibold flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-[#C5A880]" /> Nhập Mã Giảm Giá
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MÃ GIẢM GIÁ"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={!!promoApplied}
                  className="flex-grow bg-[#FAF9F6]/10 border border-[#FAF9F6]/20 rounded-xl px-3 py-2 text-xs font-bold tracking-widest text-[#FAF9F6] outline-none focus:border-[#C5A880]"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode || !!promoApplied || isLoading}
                  className="bg-[#C5A880] hover:bg-[#b0936e] disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold text-[#FAF9F6] cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              {promoError && <p className="text-red-300 text-[10px] mt-1 font-semibold">⚠️ {promoError}</p>}
              {promoApplied && (
                <p className="text-green-300 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Đã áp dụng mã: {promoApplied}
                </p>
              )}
            </div>

            {/* Chi tiết tính toán hóa đơn */}
            <div className="border-t border-[#FAF9F6]/10 pt-6 flex flex-col gap-3 text-xs font-light">
              <div className="flex items-center justify-between">
                <span>Tổng tiền phòng ({pricing.nightsCount} đêm)</span>
                <span>{pricing.roomChargesRaw.toLocaleString()} VND</span>
              </div>
              {pricing.discountApplied > 0 && (
                <div className="flex items-center justify-between text-green-300">
                  <span>Khuyến mãi giảm giá</span>
                  <span>-{pricing.discountApplied.toLocaleString()} VND</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-sm border-t border-[#FAF9F6]/10 pt-3 text-[#C5A880]">
                <span>Tổng cộng phải trả</span>
                <span>{pricing.finalTotalPrice.toLocaleString()} VND</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[#FAF9F6] bg-[#FAF9F6]/10 p-3 rounded-xl border border-[#FAF9F6]/15 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#C5A880]">Số tiền đặt cọc trước</span>
                  <span className="text-[9px] text-[#FAF9F6]/60 font-light mt-0.5">Đặt cọc giữ phòng ({pricing.depositRate * 100}%)</span>
                </div>
                <span className="text-lg font-serif font-black">{pricing.depositRequired.toLocaleString()} VND</span>
              </div>
            </div>

            {/* Nút bấm thanh toán */}
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full h-14 bg-[#C5A880] hover:bg-[#b0936e] disabled:opacity-50 text-[#FAF9F6] font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-black/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? 'Đang xử lý giao dịch...' : 'Thanh Toán Đặt Cọc'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-[9px] text-[#FAF9F6]/60 font-light text-center leading-normal">
              Bằng việc nhấn Thanh toán, bạn đồng ý với các chính sách hủy phòng và điều khoản của Galophy Retreats.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-[#1E463C]/60 uppercase tracking-widest font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#C5A880]" /> Kết nối cổng Sandbox an toàn 100%
          </div>
        </div>
      </div>
    </div>
  );
}
