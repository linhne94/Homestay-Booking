import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { bookingId, token } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đặt phòng.' }, { status: 400 });
    }

    // Tìm đơn đặt phòng
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Đơn đặt phòng không tồn tại.' }, { status: 404 });
    }

    // Bảo vệ bằng token nếu là khách vãng lai
    if (booking.guest_token && booking.guest_token !== token) {
      return NextResponse.json({ success: false, error: 'Mã xác thực bảo mật không đúng.' }, { status: 403 });
    }

    // Kiểm tra trạng thái có thể hủy
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ success: false, error: 'Đơn đặt phòng ở trạng thái này không thể hủy.' }, { status: 400 });
    }

    // Kiểm tra chính sách 3 ngày trước ngày check-in
    const today = new Date();
    const checkInDate = new Date(booking.check_in);
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (booking.status === 'CONFIRMED' && diffDays < 3) {
      return NextResponse.json({ success: false, error: 'Không thể hủy phòng đã cọc trong vòng 3 ngày trước ngày nhận phòng.' }, { status: 400 });
    }

    // Tiến hành hủy đơn trong transaction
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Nếu có mã khuyến mãi, trả lại lượt dùng (nếu có giới hạn)
      const bookingPromo = await tx.bookingPromotion.findFirst({
        where: { booking_id: bookingId },
        include: { promotion: true },
      });

      if (bookingPromo && bookingPromo.promotion.usage_limit !== null) {
        await tx.promotion.update({
          where: { id: bookingPromo.promotion_id },
          data: { usage_limit: { increment: 1 } },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Hủy đơn đặt phòng thành công.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
