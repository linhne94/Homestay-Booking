'use server';

import { prisma } from '@/lib/prisma';
import { BookingStatus, RefundStatus, PaymentStatus } from '@prisma/client';

export interface RefundInput {
  bookingId: string;
  amount: number;
  reason: string;
}

/**
 * Server Action xử lý yêu cầu hoàn tiền phòng (Refund Management) dành cho Admin
 */
export async function processBookingRefund(input: RefundInput) {
  const { bookingId, amount, reason } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Tìm Booking kèm các Payment đã PAID
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          where: { status: PaymentStatus.PAID },
        },
        refunds: true,
      },
    });

    if (!booking) {
      throw new Error('Không tìm thấy thông tin đặt phòng.');
    }

    // 2. Tính tổng số tiền đã thanh toán thực tế
    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Tính tổng số tiền đã hoàn trước đó
    const totalRefundedSoFar = booking.refunds
      .filter(r => r.status === RefundStatus.PROCESSED)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const maxRefundable = totalPaid - totalRefundedSoFar;

    if (amount > maxRefundable) {
      throw new Error(`Số tiền yêu cầu hoàn (${amount.toLocaleString()} VND) vượt quá giới hạn có thể hoàn trả (${maxRefundable.toLocaleString()} VND).`);
    }

    // 3. Lấy Payment hợp lệ đầu tiên để liên kết hoàn tiền (VNPAY/Momo)
    if (booking.payments.length === 0) {
      throw new Error('Đơn hàng chưa có giao dịch thanh toán thành công để hoàn tiền.');
    }
    const targetPayment = booking.payments[0];

    // 4. Tạo bản ghi Refund ở trạng thái PENDING
    const refund = await tx.refund.create({
      data: {
        payment_id: targetPayment.id,
        booking_id: booking.id,
        amount: amount,
        reason: reason,
        status: RefundStatus.PENDING,
      },
    });

    // 5. GIẢ LẬP GỌI GATEWAY HOÀN TIỀN (VNPAY / MOMO Sandbox)
    // Tại đây, ta mock thành công vì là môi trường test.
    // Thực tế sẽ dùng axios gọi refund API của Momo/VNPAY
    const gatewaySuccess = true; 

    if (gatewaySuccess) {
      // Cập nhật Refund sang PROCESSED
      const updatedRefund = await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.PROCESSED,
          processed_at: new Date(),
        },
      });

      // Cập nhật số tiền hoàn lại trong Booking
      const newRefundAmount = Number(booking.refund_amount) + amount;
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          refund_amount: newRefundAmount,
          status: BookingStatus.CANCELLED, // Hủy phòng khi hoàn tiền thành công
        },
      });

      return {
        success: true,
        message: 'Hoàn tiền và hủy phòng thành công!',
        refund: updatedRefund,
      };
    } else {
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.REJECTED,
        },
      });
      throw new Error('Giao dịch hoàn tiền tại cổng thanh toán bị từ chối.');
    }
  });
}
