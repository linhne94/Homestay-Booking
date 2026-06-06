import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature: momoSignature,
    } = body;

    const accessKey = process.env.MOMO_ACCESS_KEY || 'your-momo-access-key';
    const secretKey = process.env.MOMO_SECRET_KEY || 'your-momo-secret-key';

    // Xây dựng lại signature để kiểm chứng tính xác thực từ Momo
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // 1. Kiểm tra chữ ký bảo mật
    if (momoSignature !== expectedSignature) {
      return NextResponse.json({ status: 400, message: 'Invalid signature' });
    }

    // 2. Tìm Booking
    const booking = await prisma.booking.findUnique({
      where: { id: orderId },
    });

    if (!booking) {
      return NextResponse.json({ status: 404, message: 'Booking not found' });
    }

    // 3. Kiểm tra trạng thái đơn hàng
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      return NextResponse.json({ status: 200, message: 'Booking already updated' });
    }

    // 4. Xử lý kết quả thanh toán từ Momo
    if (resultCode === 0) {
      const parsedAmount = Number(amount);
      
      await prisma.$transaction(async (tx) => {
        // Tạo bản ghi Payment
        await tx.payment.create({
          data: {
            booking_id: booking.id,
            amount: parsedAmount,
            method: PaymentMethod.MOMO,
            type: parsedAmount >= Number(booking.total_price) ? PaymentType.FULL : PaymentType.DEPOSIT,
            status: PaymentStatus.PAID,
            transaction_ref: String(transId),
            gateway_response: JSON.stringify(body),
            paid_at: new Date(),
          },
        });

        // Cập nhật booking sang CONFIRMED
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
          },
        });
      });

      return NextResponse.json({ status: 200, message: 'Success' });
    } else {
      // Thanh toán thất bại từ phía Momo
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      return NextResponse.json({ status: 200, message: 'Updated as Cancelled' });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 500, message: 'Internal Server Error: ' + error.message });
  }
}
