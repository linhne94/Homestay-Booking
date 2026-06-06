'use server';

import { getAvailableRoomTypes, createSecureBooking } from '@/lib/booking';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action lấy danh sách phòng trống và tính giá động
 */
export async function getRoomsAvailabilityAction(
  branchId: string,
  checkInStr: string,
  checkOutStr: string,
  promoCode?: string
) {
  if (!branchId || !checkInStr || !checkOutStr) {
    return { success: false, error: 'Thiếu thông tin tra cứu.' };
  }

  try {
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return { success: false, error: 'Định dạng ngày không hợp lệ.' };
    }

    const availabilities = await getAvailableRoomTypes(branchId, checkIn, checkOut, promoCode);
    return { success: true, data: availabilities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action tạo đặt phòng bảo mật chống trùng phòng
 */
export async function createBookingAction(input: {
  roomTypeId: string;
  checkInStr: string;
  checkOutStr: string;
  numGuests: number;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  promoCode?: string;
}) {
  const {
    roomTypeId,
    checkInStr,
    checkOutStr,
    numGuests,
    userId,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
    promoCode,
  } = input;

  if (!roomTypeId || !checkInStr || !checkOutStr || !numGuests) {
    return { success: false, error: 'Thiếu thông tin đặt phòng bắt buộc.' };
  }

  try {
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return { success: false, error: 'Ngày nhận/trả phòng không hợp lệ.' };
    }

    const result = await createSecureBooking({
      roomTypeId,
      checkIn,
      checkOut,
      numGuests,
      userId,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      promoCode,
    });

    revalidatePath('/admin/bookings');
    revalidatePath('/dashboard');

    return {
      success: true,
      booking: {
        id: result.booking.id,
        totalPrice: Number(result.booking.total_price),
        depositAmount: Number(result.booking.deposit_amount),
        status: result.booking.status,
      },
      roomNumber: result.roomNumber,
      guestToken: result.guestToken,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action tạo Review mới cho Booking đã Checked-out
 */
export async function createReviewAction(input: {
  bookingId: string;
  userId: string;
  ratingOverall: number;
  ratingCleanliness: number;
  ratingService: number;
  ratingLocation: number;
  comment: string;
}) {
  const { bookingId, userId, ratingOverall, ratingCleanliness, ratingService, ratingLocation, comment } = input;

  if (!bookingId || !userId || !ratingOverall) {
    return { success: false, error: 'Thiếu thông tin đánh giá.' };
  }

  try {
    // 1. Kiểm tra booking hợp lệ
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        user_id: userId,
        status: 'CHECKED_OUT',
      },
      include: {
        reviews: true,
      }
    });

    if (!booking) {
      return { success: false, error: 'Đơn đặt phòng không tồn tại hoặc chưa được hoàn tất trả phòng.' };
    }

    if (booking.reviews.length > 0) {
      return { success: false, error: 'Đơn đặt phòng này đã được viết đánh giá trước đó.' };
    }

    // 2. Tạo review và cộng điểm loyalty thưởng (ví dụ: +100 điểm loyalty) trong transaction
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          booking_id: bookingId,
          user_id: userId,
          rating_overall: ratingOverall,
          rating_cleanliness: ratingCleanliness,
          rating_service: ratingService,
          rating_location: ratingLocation,
          comment,
        },
      });

      // Cộng 100 điểm thưởng loyalty
      await tx.user.update({
        where: { id: userId },
        data: {
          loyalty_points: { increment: 100 },
        },
      });

      // Ghi log giao dịch loyalty
      await tx.loyaltyTransaction.create({
        data: {
          user_id: userId,
          booking_id: bookingId,
          points: 100,
          type: 'EARNED',
          description: 'Cộng 100 điểm thưởng khi viết đánh giá phòng ' + bookingId.slice(0, 8),
        },
      });
    });

    revalidatePath('/dashboard');
    revalidatePath(`/rooms/${booking.room_id}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Không thể tạo đánh giá: ' + error.message };
  }
}

/**
 * Server Action cập nhật trạng thái đơn đặt phòng & tự động đồng bộ trạng thái thực tế của Room
 */
export async function updateBookingStatusAction(bookingId: string, newStatus: string) {
  try {
    const validStatuses = ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Trạng thái mới không hợp lệ.' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return { success: false, error: 'Đơn đặt phòng không tồn tại.' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus as any },
      });

      // 2. Đồng bộ trạng thái vật lý của Room tương ứng
      if (newStatus === 'CHECKED_IN') {
        await tx.room.update({
          where: { id: booking.room_id },
          data: { status: 'OCCUPIED' },
        });
      } else if (newStatus === 'CHECKED_OUT') {
        await tx.room.update({
          where: { id: booking.room_id },
          data: { status: 'CLEANING' },
        });
      } else if (newStatus === 'CANCELLED') {
        await tx.room.update({
          where: { id: booking.room_id },
          data: { status: 'AVAILABLE' },
        });
      }
    });

    revalidatePath('/admin');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/timeline');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Cập nhật trạng thái thất bại: ' + error.message };
  }
}

