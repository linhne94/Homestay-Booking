import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const secureHash = params['vnp_SecureHash'];
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    // Sắp xếp các tham số
    const keys = Object.keys(params).sort();
    const sortedParams: Record<string, string> = {};
    for (const key of keys) {
      sortedParams[key] = params[key];
    }

    const hashSecret = process.env.VNPAY_HASH_SECRET || 'your-vnpay-hash-secret';
    const signData = new URLSearchParams(sortedParams).toString();

    // Tính toán lại mã băm HMAC-SHA512 để đối chiếu
    const hmac = crypto.createHmac('sha512', hashSecret);
    const expectedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 1. Xác thực chữ ký
    if (secureHash !== expectedHash) {
      return NextResponse.json({ RspCode: '97', Message: 'Invalid Signature' });
    }

    const bookingId = params['vnp_TxnRef'];
    const amount = Number(params['vnp_Amount']) / 100;
    const responseCode = params['vnp_ResponseCode'];
    const transactionRef = params['vnp_TransactionNo'];

    // 2. Tìm Booking trong database
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ RspCode: '01', Message: 'Order not found' });
    }

    // 3. Kiểm tra số tiền
    // Ở sandbox, cho phép cọc hoặc thanh toán đầy đủ
    const isAmountValid = Math.abs(Number(booking.deposit_amount) - amount) < 100 || Math.abs(Number(booking.total_price) - amount) < 100;
    if (!isAmountValid) {
      return NextResponse.json({ RspCode: '04', Message: 'Invalid Amount' });
    }

    // 4. Kiểm tra xem đơn đặt đã được cập nhật trước đó chưa
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // 5. Cập nhật trạng thái thanh toán & booking
    if (responseCode === '00') {
      // Thanh toán thành công! Chạy Prisma transaction
      await prisma.$transaction(async (tx) => {
        // Tạo bản ghi Payment
        await tx.payment.create({
          data: {
            booking_id: booking.id,
            amount: amount,
            method: PaymentMethod.VNPAY,
            type: amount >= Number(booking.total_price) ? PaymentType.FULL : PaymentType.DEPOSIT,
            status: PaymentStatus.PAID,
            transaction_ref: transactionRef,
            gateway_response: JSON.stringify(params),
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

      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      // Thanh toán thất bại
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error: any) {
    return NextResponse.json({ RspCode: '99', Message: 'System Error: ' + error.message });
  }
}
