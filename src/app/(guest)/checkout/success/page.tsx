import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, AlertTriangle, Calendar, Users, MapPin, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    bookingId?: string;
    token?: string;
    paymentStatus?: string;
  }>;
}) {
  const { bookingId, token, paymentStatus } = await searchParams;

  if (!bookingId) {
    return notFound();
  }

  let booking: any = null;

  try {
    // Query thông tin Booking để hiển thị hoá đơn chi tiết
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            room_type: {
              include: {
                branch: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paid_at: 'desc' },
        },
      },
    });

    // Nếu thanh toán thành công (redirect thành công từ VNPAY/Momo) và đơn đặt phòng vẫn đang chờ thanh toán
    if (booking && paymentStatus === 'success' && booking.status === 'PENDING_PAYMENT') {
      await prisma.$transaction(async (tx) => {
        // Tạo bản ghi Payment
        await tx.payment.create({
          data: {
            booking_id: booking.id,
            amount: booking.deposit_amount,
            method: 'VNPAY', // Cổng thanh toán
            type: 'DEPOSIT',
            status: 'PAID',
            transaction_ref: 'TEST_TX_' + Date.now().toString().slice(-8),
            gateway_response: JSON.stringify({ message: 'Auto-confirmed on success redirect' }),
            paid_at: new Date(),
          },
        });

        // Cập nhật trạng thái Booking sang CONFIRMED
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CONFIRMED',
          },
        });
      });

      // Refetch lại thông tin đặt phòng mới nhất
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: {
            include: {
              room_type: {
                include: {
                  branch: true,
                },
              },
            },
          },
          payments: {
            orderBy: { paid_at: 'desc' },
          },
        },
      });
    }
  } catch (dbError) {
    console.error('⚠️ [Database Error] Không kết nối được DB khi tải trang success:', dbError);
  }

  // Fallback sang dữ liệu mẫu khi db lỗi hoặc booking không tìm thấy (Demo Mode)
  if (!booking) {
    booking = {
      id: bookingId || 'demo-booking-uuid-123456789',
      check_in: new Date().toISOString(),
      check_out: new Date(Date.now() + 86400000).toISOString(),
      num_guests: 2,
      total_price: 1500000.00,
      deposit_amount: 750000.00,
      guest_token: token || 'demo-token-123',
      payments: paymentStatus === 'success' ? [{ status: 'PAID', paid_at: new Date().toISOString() }] : [],
      room: {
        room_number: '101',
        floor: 1,
        room_type: {
          name: 'Forest View Glass Cabin (Demo)',
          thumbnail_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
          deposit_rate: 0.50,
          branch: {
            city: 'Đà Lạt',
          }
        }
      }
    };
  }

  // Kiểm tra tính hợp lệ của token nếu là khách vãng lai
  if (booking.guest_token && booking.guest_token !== token) {
    return (
      <div className="max-w-md mx-auto my-32 text-center bg-white p-8 rounded-3xl border border-red-100 shadow-lg text-[#1E463C]">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="font-serif text-2xl font-bold mb-4">Lỗi Xác Thực</h2>
        <p className="text-sm font-light text-red-500 mb-6">Mã bảo mật đặt phòng không chính xác.</p>
        <Link href="/" className="px-6 py-3 bg-[#1E463C] text-[#FAF9F6] rounded-xl text-xs font-bold uppercase tracking-wider">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const isPaid = booking.payments.some((p: any) => p.status === 'PAID') || paymentStatus === 'success';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    JSON.stringify({ bookingId: booking.id, room: booking.room.room_number, checkIn: booking.check_in })
  )}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-[#1E463C] flex flex-col items-center gap-10">
      {/* Header trạng thái */}
      <div className="text-center flex flex-col items-center gap-4">
        {isPaid ? (
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-200 animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center border-2 border-amber-200">
            <AlertTriangle className="w-12 h-12 text-amber-600 animate-bounce" />
          </div>
        )}
        
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-2">
          {isPaid ? 'Đơn Đặt Phòng Đã Được Xác Nhận!' : 'Đang Chờ Xác Nhận Giao Dịch!'}
        </h1>
        <p className="max-w-md text-xs font-light text-[#1E463C]/80 leading-relaxed">
          {isPaid 
            ? 'Cảm ơn quý khách đã tin tưởng Galophy Retreats. Chúng tôi đã nhận cọc và giữ căn phòng tuyệt đẹp này cho bạn.' 
            : 'Hệ thống đang kiểm tra phản hồi từ cổng thanh toán. Nếu đã trừ tiền thành công, trạng thái sẽ tự động cập nhật trong vài phút.'}
        </p>
      </div>

      {/* Bill tóm tắt chi tiết đặt phòng */}
      <div className="w-full bg-white rounded-3xl border border-[#1E463C]/10 shadow-lg p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Nền mờ thương hiệu */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/10 rounded-bl-full flex items-center justify-center font-serif text-xs font-black text-[#C5A880]/40">
          BILL
        </div>

        <div className="flex flex-col gap-1.5 border-b border-[#1E463C]/10 pb-4">
          <span className="text-[10px] text-[#C5A880] uppercase tracking-widest font-bold">Mã đặt phòng (ID)</span>
          <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 w-fit select-all">
            {booking.id}
          </span>
        </div>

        {/* Tên phòng & Chi nhánh */}
        <div className="flex gap-4 border-b border-[#1E463C]/10 pb-6">
          <img 
            src={booking.room.room_type.thumbnail_url} 
            alt={booking.room.room_type.name} 
            className="w-16 h-16 object-cover rounded-2xl border border-[#1E463C]/10 shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880]">Chi nhánh {booking.room.room_type.branch.city}</span>
            <h3 className="font-serif font-bold text-base">{booking.room.room_type.name}</h3>
            <p className="text-[10px] text-[#1E463C]/70 font-light flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#C5A880]" /> Số phòng được gán: <strong className="font-semibold text-[#1E463C]">{booking.room.room_number}</strong> (Tầng {booking.room.floor})
            </p>
          </div>
        </div>

        {/* Lịch check-in/out */}
        <div className="grid grid-cols-2 gap-6 border-b border-[#1E463C]/10 pb-6 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-[#1E463C]/60 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Check-in
            </span>
            <strong className="font-semibold text-sm">{new Date(booking.check_in).toLocaleDateString('vi-VN')}</strong>
            <span className="text-[10px] text-[#1E463C]/50 font-light mt-0.5">Từ 14:00</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-[#1E463C]/10 pl-6">
            <span className="text-[9px] uppercase tracking-wider text-[#1E463C]/60 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Check-out
            </span>
            <strong className="font-semibold text-sm">{new Date(booking.check_out).toLocaleDateString('vi-VN')}</strong>
            <span className="text-[10px] text-[#1E463C]/50 font-light mt-0.5">Trước 12:00</span>
          </div>

          <div className="col-span-2 flex items-center gap-4 text-[#1E463C]/75">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#C5A880]" /> {booking.num_guests} khách nghỉ</span>
          </div>
        </div>

        {/* Tài chính */}
        <div className="flex flex-col gap-3 text-xs border-b border-[#1E463C]/10 pb-6">
          <div className="flex items-center justify-between font-light">
            <span>Tổng số tiền dịch vụ phòng</span>
            <span>{Number(booking.total_price).toLocaleString()} VND</span>
          </div>
          <div className="flex items-center justify-between font-bold text-sm text-[#1E463C]">
            <span>Số tiền cọc tối thiểu ({Number(booking.room.room_type.deposit_rate) * 100}%)</span>
            <span>{Number(booking.deposit_amount).toLocaleString()} VND</span>
          </div>
          <div className="flex items-center justify-between font-bold text-[#1E463C] bg-green-50 p-3.5 rounded-2xl border border-green-100">
            <span>Số tiền cọc đã đóng thực tế</span>
            <span className="text-lg text-green-600 font-serif font-black">{isPaid ? Number(booking.deposit_amount).toLocaleString() : '0'} VND</span>
          </div>
        </div>

        {/* Mô phỏng check-in bằng mã QR và link tra cứu */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#FAF9F6] rounded-2xl border border-[#1E463C]/5">
          <div className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm shrink-0">
            <img src={qrCodeUrl} alt="Check-in QR Code" className="w-32 h-32 object-contain" />
          </div>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h4 className="font-serif font-bold text-sm flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Smart Check-in QR Code
            </h4>
            <p className="text-[11px] text-[#1E463C]/70 leading-normal font-light">
              Quý khách vui lòng chụp lại hóa đơn này hoặc lưu lại mã QR này. Khi đến homestay, chỉ cần đưa mã QR cho lễ tân quét để nhận phòng nhanh chóng không cần làm thủ tục rườm rà.
            </p>
          </div>
        </div>

        {/* Guest Portal link */}
        {booking.guest_token && (
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-xs font-light text-amber-900 leading-relaxed">
            <strong className="font-bold text-amber-950 flex items-center gap-1.5 mb-1.5">
              ⚠️ Lưu ý dành cho Khách vãng lai:
            </strong>
            Bạn đặt phòng ở chế độ khách vãng lai. Hãy lưu giữ đường liên kết truy cập bảo mật dưới đây để có thể tra cứu trạng thái thanh toán, lấy QR Code nhận phòng hoặc yêu cầu hủy phòng bất kỳ lúc nào:
            <Link 
              href={`/guest-portal?token=${booking.guest_token}`}
              className="text-[#1E463C] font-semibold underline mt-2 block flex items-center gap-1 hover:text-[#C5A880]"
              target="_blank"
            >
              Xem chi tiết hóa đơn của bạn <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Hành động */}
      <div className="flex gap-4">
        <Link 
          href="/" 
          className="px-8 py-3.5 rounded-full bg-[#1E463C] text-[#FAF9F6] font-bold text-xs uppercase tracking-wider hover:bg-[#285d4f] transition-all hover:shadow-lg"
        >
          Về Trang Chủ
        </Link>
        {booking.guest_token ? (
          <Link 
            href={`/guest-portal?token=${booking.guest_token}`} 
            className="px-8 py-3.5 rounded-full border border-[#1E463C]/20 hover:border-[#1E463C] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 group"
          >
            Quản Lý Booking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <Link 
            href="/dashboard" 
            className="px-8 py-3.5 rounded-full border border-[#1E463C]/20 hover:border-[#1E463C] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 group"
          >
            Lịch Sử Đặt Phòng <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}
