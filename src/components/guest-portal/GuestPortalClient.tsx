'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, ShieldCheck, Star, Trash2, ArrowRight, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  deposit_amount: number;
  status: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string;
  created_at: string;
  room: {
    room_number: string;
    floor: number;
    room_type: {
      name: string;
      thumbnail_url: string;
      deposit_rate: number;
      branch: {
        name: string;
        city: string;
        address: string;
      };
    };
  };
}

export default function GuestPortalClient({
  initialBooking,
  token,
}: {
  initialBooking: Booking | null;
  token: string | null;
}) {
  const router = useRouter();
  
  // States cho form tra cứu nếu chưa có booking
  const [searchBookingId, setSearchBookingId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // States cho booking hiện tại
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBookingId || !searchPhone) {
      setErrorMessage('Vui lòng nhập cả Mã đặt phòng và Số điện thoại đăng ký.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/booking/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: searchBookingId.trim(),
          phone: searchPhone.trim(),
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setBooking(result.data);
      } else {
        setErrorMessage(result.error || 'Không tìm thấy thông tin đặt phòng khớp.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Bạn có chắc chắn muốn yêu cầu hủy đơn đặt phòng này không?')) return;

    setIsCancelling(true);
    setCancelMessage('');

    try {
      const res = await fetch(`/api/booking/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          token: token || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setBooking({ ...booking, status: 'CANCELLED' });
        setCancelMessage('Hủy phòng thành công! Trạng thái phòng đã được cập nhật.');
      } else {
        setCancelMessage('Lỗi: ' + result.error);
      }
    } catch {
      setCancelMessage('Lỗi kết nối server.');
    } finally {
      setIsCancelling(false);
    }
  };

  const qrCodeUrl = booking
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        JSON.stringify({ bookingId: booking.id, room: booking.room.room_number, checkIn: booking.check_in })
      )}`
    : '';

  // Phân tích màu trạng thái booking
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500 text-white';
      case 'PENDING_PAYMENT':
        return 'bg-amber-500 text-white';
      case 'CHECKED_IN':
        return 'bg-blue-600 text-white';
      case 'CHECKED_OUT':
        return 'bg-zinc-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-zinc-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Đã xác nhận & nhận cọc';
      case 'PENDING_PAYMENT': return 'Chờ thanh toán đặt cọc';
      case 'CHECKED_IN': return 'Đang lưu trú';
      case 'CHECKED_OUT': return 'Đã trả phòng';
      case 'CANCELLED': return 'Đã hủy phòng';
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-wood-dark min-h-[70vh] flex flex-col justify-center">
      {/* 1. Trường hợp chưa có hoặc không tìm thấy booking (Form tra cứu) */}
      {!booking ? (
        <div className="w-full">
          <div className="max-w-[480px] mx-auto bg-white p-10 rounded-2xl border border-wood-light shadow-xl flex flex-col gap-6 mt-12">
            <div className="text-center flex flex-col gap-1.5">
              <QrCode className="w-10 h-10 text-primary-light mx-auto mb-2" />
              <h2 className="font-serif text-2xl font-semibold text-wood-dark">Tìm đơn đặt phòng của bạn</h2>
              <p className="text-sm text-primary-light leading-relaxed font-light">
                Nhập mã đặt phòng và số điện thoại để xem chi tiết hoặc nhận QR check-in
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleLookup} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-sm font-medium text-wood-dark mb-1">Mã đặt phòng (Booking ID)</label>
                <input
                  type="text"
                  placeholder="Nhập mã đặt phòng của bạn..."
                  value={searchBookingId}
                  onChange={(e) => setSearchBookingId(e.target.value)}
                  className="w-full bg-bg-main border border-wood-light rounded-xl px-4 py-3 text-sm text-wood-dark focus:border-primary focus:outline-none placeholder-wood-light/50 font-normal cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-sm font-medium text-wood-dark mb-1">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full bg-bg-main border border-wood-light rounded-xl px-4 py-3 text-sm text-wood-dark focus:border-primary focus:outline-none placeholder-wood-light/50 font-normal cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-light hover:scale-[1.01] active:scale-[0.99] text-white font-medium text-[15px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Đang tra cứu...' : 'Tìm kiếm đơn đặt'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
          
          <p className="text-primary-light text-sm text-center mt-6">
            Cần hỗ trợ? Liên hệ Zalo: <span className="font-semibold">036.757.3242</span>
          </p>
        </div>
      ) : (
        /* 2. Trường hợp có booking (Hiển thị hoá đơn chi tiết và QR Code) */
        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-wood-light/30 pb-6">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-wood-dark">Chi tiết đơn đặt phòng</h1>
              <p className="text-xs text-primary-light font-light mt-1">Tra cứu bảo mật dành cho khách hàng</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase ${getStatusBadge(booking.status)} shadow-sm`}>
              {getStatusText(booking.status)}
            </div>
          </div>

          {cancelMessage && (
            <div className="bg-blue-50 border border-blue-200 text-primary px-6 py-4 rounded-2xl text-xs font-semibold">
              ℹ️ {cancelMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Hóa đơn phòng (8 columns) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-wood-light shadow-lg p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 border-b border-wood-light/35 pb-4">
                <span className="text-xs text-primary font-semibold">Mã đặt phòng (ID)</span>
                <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 w-fit select-all">
                  {booking.id}
                </span>
              </div>

              {/* Tên phòng & Chi nhánh */}
              <div className="flex gap-4 border-b border-wood-light/35 pb-6">
                <img 
                  src={booking.room.room_type.thumbnail_url} 
                  alt={booking.room.room_type.name} 
                  className="w-16 h-16 object-cover rounded-xl border border-wood-light shrink-0"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-semibold text-primary">Chi nhánh {booking.room.room_type.branch.city}</span>
                  <h3 className="font-serif font-bold text-base text-wood-dark">{booking.room.room_type.name}</h3>
                  <p className="text-[10px] text-wood-dark/75 font-light flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-primary-light" /> Số phòng: <strong className="font-semibold text-wood-dark">{booking.room.room_number}</strong> (Tầng {booking.room.floor})
                  </p>
                </div>
              </div>

              {/* Lịch check-in/out */}
              <div className="grid grid-cols-2 gap-6 border-b border-wood-light/35 pb-6 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-wood-dark/80 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Ngày nhận phòng
                  </span>
                  <strong className="font-semibold text-sm text-wood-dark">{new Date(booking.check_in).toLocaleDateString('vi-VN')}</strong>
                  <span className="text-[10px] text-wood-dark/50 font-light mt-0.5">Từ 14:00</span>
                </div>

                <div className="flex flex-col gap-1 border-l border-wood-light/35 pl-6">
                  <span className="text-xs font-semibold text-wood-dark/80 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Ngày trả phòng
                  </span>
                  <strong className="font-semibold text-sm text-wood-dark">{new Date(booking.check_out).toLocaleDateString('vi-VN')}</strong>
                  <span className="text-[10px] text-wood-dark/50 font-light mt-0.5">Trước 12:00</span>
                </div>

                <div className="col-span-2 flex items-center gap-4 text-wood-dark/75">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary-light" /> {booking.num_guests} khách nghỉ</span>
                </div>
              </div>

              {/* Thông tin khách */}
              <div className="border-b border-wood-light/35 pb-6 text-xs flex flex-col gap-3">
                <h4 className="font-serif font-semibold text-sm text-primary">Thông tin liên hệ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-light text-wood-dark/80">
                  <p>Họ tên: <strong className="font-medium text-wood-dark">{booking.guest_name}</strong></p>
                  <p>Số điện thoại: <strong className="font-medium text-wood-dark">{booking.guest_phone}</strong></p>
                  <p className="sm:col-span-2">Email: <strong className="font-medium text-wood-dark">{booking.guest_email}</strong></p>
                  {booking.special_requests && (
                    <p className="sm:col-span-2 bg-bg-main p-3 rounded-xl border border-wood-light/30 italic text-wood-dark/75">
                      Yêu cầu đặc biệt: &ldquo;{booking.special_requests}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Chi tiết tài chính */}
              <div className="flex flex-col gap-3 text-xs">
                <h4 className="font-serif font-semibold text-sm text-primary mb-1">Chi tiết hóa đơn</h4>
                <div className="flex items-center justify-between font-light">
                  <span>Tổng giá trị đặt phòng</span>
                  <span>{Number(booking.total_price).toLocaleString()} VND</span>
                </div>
                <div className="flex items-center justify-between font-light">
                  <span>Khoản đặt cọc giữ chỗ ({Number(booking.room.room_type.deposit_rate) * 100}%)</span>
                  <span>{Number(booking.deposit_amount).toLocaleString()} VND</span>
                </div>
                <div className="flex items-center justify-between font-bold text-sm border-t border-wood-light/35 pt-3">
                  <span>Trạng thái cọc thực tế</span>
                  <span className={booking.status !== 'PENDING_PAYMENT' && booking.status !== 'CANCELLED' ? 'text-green-600' : 'text-amber-600'}>
                    {booking.status !== 'PENDING_PAYMENT' && booking.status !== 'CANCELLED' ? `Đã thanh toán (${Number(booking.deposit_amount).toLocaleString()} VND)` : 'Chưa đặt cọc'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cột phải: QR Code & Huỷ phòng (4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6 w-full">
              {/* QR Code Card */}
              {booking.status !== 'CANCELLED' && (
                <div className="bg-white p-6 rounded-2xl border border-wood-light shadow-lg text-center flex flex-col items-center gap-4">
                  <h4 className="font-serif font-semibold text-sm text-wood-dark flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary-light" /> QR Code Check-in
                  </h4>
                  <div className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                    <img src={qrCodeUrl} alt="Check-in QR Code" className="w-36 h-36 object-contain" />
                  </div>
                  <p className="text-[10px] text-wood-dark/70 leading-normal font-light">
                    Đưa mã QR này cho lễ tân khi check-in tại homestay để nhận phòng ngay lập tức.
                  </p>
                </div>
              )}

              {/* Card Yêu cầu hủy đặt phòng */}
              {(booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT') && (
                <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-md flex flex-col gap-4">
                  <h4 className="font-serif font-semibold text-sm text-red-950 flex items-center gap-1.5">
                    <Trash2 className="w-4.5 h-4.5 text-red-600" /> Hủy phòng nghỉ
                  </h4>
                  <p className="text-[10px] text-red-900 leading-normal font-light">
                    Quý khách có thể yêu cầu hủy đặt phòng trước 3 ngày kể từ ngày nhận phòng. Đơn hàng chưa đặt cọc có thể hủy bất kỳ lúc nào.
                  </p>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-750 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-55 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isCancelling ? 'Đang hủy...' : 'Hủy đặt phòng này'}
                  </button>
                </div>
              )}

              {/* Nút quay lại trang chủ */}
              <button
                onClick={() => {
                  setBooking(null);
                  router.push('/guest-portal');
                }}
                className="w-full h-11 rounded-xl border border-wood-light bg-white hover:border-primary hover:scale-[1.02] active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer text-wood-dark"
              >
                Tra cứu hóa đơn khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
