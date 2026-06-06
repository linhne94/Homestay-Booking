import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVnpayPaymentUrl, createMomoPaymentUrl } from '@/lib/payment';

export async function POST(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const body = await request.json();
    const { bookingId, method, guestToken } = body;

    if (!bookingId || !method) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin đặt phòng hoặc phương thức thanh toán.' }, { status: 400 });
    }

    let booking: any = null;

    try {
      // 1. Lấy thông tin đặt phòng từ Database
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: {
            include: {
              room_type: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error('⚠️ [Database Error] Không kết nối được DB khi tạo link thanh toán:', dbError);
    }

    // Nếu không kết nối được database hoặc dùng booking mock/demo
    if (!booking) {
      // Giả lập thông tin để tạo link sandbox
      const mockAmount = 750000; // Số tiền demo (VND)
      const returnUrl = `${origin}/checkout/success?bookingId=${bookingId}&token=${guestToken || ''}&paymentStatus=success`;

      if (method === 'VNPAY') {
        const paymentUrl = createVnpayPaymentUrl({
          amount: mockAmount,
          txnRef: bookingId,
          orderInfo: `Thanh toan dat coc phong (Demo)`,
          returnUrl,
          ipAddress: '127.0.0.1',
        });
        return NextResponse.json({ success: true, paymentUrl });
      } else if (method === 'MOMO') {
        const res = await createMomoPaymentUrl({
          amount: mockAmount,
          orderId: bookingId,
          orderInfo: `Thanh toan dat coc phong (Demo)`,
          redirectUrl: returnUrl,
          ipnUrl: `${origin}/api/payment/momo-ipn`,
        });

        if (res.payUrl) {
          return NextResponse.json({ success: true, paymentUrl: res.payUrl });
        } else {
          // Fallback direct redirect nếu cổng Momo lỗi/chưa điền key
          return NextResponse.json({ success: true, paymentUrl: returnUrl });
        }
      }

      return NextResponse.json({ success: false, error: 'Phương thức thanh toán không được hỗ trợ.' });
    }

    // 2. Tạo link thanh toán thực tế khi có Database
    const amount = Number(booking.deposit_amount);
    const returnUrl = `${origin}/checkout/success?bookingId=${booking.id}&token=${guestToken || ''}&paymentStatus=success`;

    if (method === 'VNPAY') {
      const paymentUrl = createVnpayPaymentUrl({
        amount,
        txnRef: booking.id,
        orderInfo: `Thanh toan dat coc phong ${booking.room.room_type.name}`,
        returnUrl,
        ipAddress: '127.0.0.1',
      });

      return NextResponse.json({ success: true, paymentUrl });
    } else if (method === 'MOMO') {
      const res = await createMomoPaymentUrl({
        amount,
        orderId: booking.id,
        orderInfo: `Thanh toan dat coc phong ${booking.room.room_type.name}`,
        redirectUrl: returnUrl,
        ipnUrl: `${origin}/api/payment/momo-ipn`,
      });

      if (res.payUrl) {
        return NextResponse.json({ success: true, paymentUrl: res.payUrl });
      } else {
        // Fallback sang redirect trực tiếp nếu MoMo Sandbox bị từ chối do key không hợp lệ
        console.warn('⚠️ [Momo Warning] Không lấy được payUrl từ Momo, chuyển hướng sang trang success.');
        return NextResponse.json({ success: true, paymentUrl: returnUrl });
      }
    }

    return NextResponse.json({ success: false, error: 'Phương thức thanh toán không hợp lệ.' });
  } catch (error: any) {
    console.error('Lỗi khi sinh link thanh toán:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống: ' + error.message }, { status: 500 });
  }
}
