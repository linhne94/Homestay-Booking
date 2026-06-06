import { prisma } from './prisma';
import { calculateBookingPrice, formatDateKey } from './pricing';
import { BookingStatus, RoomStatus } from '@prisma/client';
import crypto from 'crypto';

export interface RoomTypeAvailability {
  id: string;
  name: string;
  max_guests: number;
  base_price: number;
  deposit_rate: number;
  description: string;
  thumbnail_url: string;
  availableRoomsCount: number;
  pricing?: any;
  amenities: {
    id: string;
    name: string;
    icon: string;
    category: string;
  }[];
  images: string[];
}

/**
 * Kiểm tra danh sách các loại phòng trống và tính toán giá động cho từng loại tại một chi nhánh
 */
export async function getAvailableRoomTypes(
  branchId: string,
  checkIn: Date,
  checkOut: Date,
  promoCode?: string
): Promise<RoomTypeAvailability[]> {
  // 1. Kiểm tra ngày blackout của chi nhánh
  const blackout = await prisma.blackoutDate.findFirst({
    where: {
      branch_id: branchId,
      date_from: { lte: checkOut },
      date_to: { gte: checkIn },
    },
  });

  if (blackout) {
    // Nếu chi nhánh đang đóng cửa trong khoảng thời gian này, không trả về phòng trống nào
    return [];
  }

  // 2. Lấy tất cả loại phòng của chi nhánh kèm hình ảnh và tiện ích
  const roomTypes = await prisma.roomType.findMany({
    where: {
      branch_id: branchId,
      is_active: true,
    },
    include: {
      room_images: {
        orderBy: { sort_order: 'asc' },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      rooms: {
        where: {
          status: { not: RoomStatus.MAINTENANCE },
        },
      },
    },
  });

  // 3. Lấy tất cả các booking đang bận chồng lấp khoảng ngày này
  const busyBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.CHECKED_OUT,
          BookingStatus.PENDING_PAYMENT,
        ],
      },
      check_in: { lt: checkOut },
      check_out: { gt: checkIn },
    },
    select: {
      room_id: true,
    },
  });

  const busyRoomIds = new Set(busyBookings.map((b) => b.room_id));

  // 4. Lọc và ánh xạ kết quả
  const results: RoomTypeAvailability[] = [];

  for (const rt of roomTypes) {
    // Đếm số phòng thực tế còn trống
    const availableRooms = rt.rooms.filter((room) => !busyRoomIds.has(room.id));
    const availableRoomsCount = availableRooms.length;

    // Tính toán giá động cho loại phòng này
    let pricing = null;
    try {
      pricing = await calculateBookingPrice(rt.id, checkIn, checkOut, promoCode);
    } catch (e) {
      // Nếu có lỗi tính giá, bỏ qua thuộc tính pricing
    }

    results.push({
      id: rt.id,
      name: rt.name,
      max_guests: rt.max_guests,
      base_price: Number(rt.base_price),
      deposit_rate: Number(rt.deposit_rate),
      description: rt.description,
      thumbnail_url: rt.thumbnail_url,
      availableRoomsCount,
      pricing,
      amenities: rt.amenities.map((a) => ({
        id: a.amenity.id,
        name: a.amenity.name,
        icon: a.amenity.icon,
        category: a.amenity.category,
      })),
      images: rt.room_images.map((img) => img.image_url),
    });
  }

  return results;
}

export interface CreateBookingInput {
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  numGuests: number;
  userId?: string; // Nullable đối với khách vãng lai (Guest Checkout)
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  promoCode?: string;
}

/**
 * Server Action/Logic đặt phòng an toàn chống trùng phòng (Double-booking) bằng Pessimistic Locking
 */
export async function createSecureBooking(input: CreateBookingInput) {
  const {
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
  } = input;

  // Khởi chạy Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Áp dụng Khóa bi quan (Pessimistic Write Lock) qua SQL FOR UPDATE
    // Tìm các phòng thuộc loại phòng này không bị bảo trì và chưa có booking trùng khoảng thời gian
    const availableRooms = await tx.$queryRaw<any[]>`
      SELECT r.id, r.room_number
      FROM "ROOM" r
      WHERE r.room_type_id = ${roomTypeId}::uuid
        AND r.status != 'MAINTENANCE'::"RoomStatus"
        AND r.id NOT IN (
          SELECT b.room_id 
          FROM "BOOKING" b
          WHERE b.status IN ('CONFIRMED'::"BookingStatus", 'CHECKED_IN'::"BookingStatus", 'CHECKED_OUT'::"BookingStatus", 'PENDING_PAYMENT'::"BookingStatus")
            AND b.check_in < ${checkOut}::date
            AND b.check_out > ${checkIn}::date
        )
      FOR UPDATE;
    `;

    if (!availableRooms || availableRooms.length === 0) {
      throw new Error('Xin lỗi! Loại phòng này vừa được đặt hết trong khoảng thời gian bạn chọn.');
    }

    // Chọn phòng trống đầu tiên có sẵn
    const selectedRoom = availableRooms[0];

    // 2. Tính toán tiền phòng qua logic pricing sử dụng context của transaction để an toàn tuyệt đối
    // Đầu tiên ta query lại thông tin loại phòng bằng transaction client
    const roomType = await tx.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        price_overrides: {
          where: {
            date_to: { gte: checkIn },
            date_from: { lte: checkOut },
          },
        },
      },
    });

    if (!roomType) {
      throw new Error('Không tìm thấy loại phòng.');
    }

    // Tái cấu trúc logic pricing trong transaction
    const basePrice = Number(roomType.base_price);
    const depositRate = Number(roomType.deposit_rate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let roomChargesRaw = 0;
    for (let i = 0; i < nightsCount; i++) {
      const currentDate = new Date(checkIn);
      currentDate.setDate(checkIn.getDate() + i);
      const dateStr = formatDateKey(currentDate);

      const override = roomType.price_overrides.find((ov) => {
        const fromStr = formatDateKey(new Date(ov.date_from));
        const toStr = formatDateKey(new Date(ov.date_to));
        return dateStr >= fromStr && dateStr <= toStr;
      });

      roomChargesRaw += override ? Number(override.price) : basePrice;
    }

    let discountApplied = 0;
    let appliedPromotionId = null;

    if (promoCode) {
      const promotion = await tx.promotion.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (
        promotion &&
        promotion.is_active &&
        new Date(promotion.valid_from) <= checkIn &&
        new Date(promotion.valid_to) >= checkOut &&
        nightsCount >= (promotion.min_nights || 1) &&
        (promotion.usage_limit === null || promotion.usage_limit > 0)
      ) {
        if (promotion.discount_pct) {
          const pct = Number(promotion.discount_pct) / 100;
          let calcD = roomChargesRaw * pct;
          if (promotion.max_discount) {
            const maxD = Number(promotion.max_discount);
            if (calcD > maxD) calcD = maxD;
          }
          discountApplied = calcD;
          appliedPromotionId = promotion.id;
        } else if (promotion.discount_flat) {
          discountApplied = Number(promotion.discount_flat);
          appliedPromotionId = promotion.id;
        }

        // Cập nhật giới hạn sử dụng của mã khuyến mãi (nếu có giới hạn)
        if (promotion.usage_limit !== null) {
          await tx.promotion.update({
            where: { id: promotion.id },
            data: { usage_limit: promotion.usage_limit - 1 },
          });
        }
      }
    }

    const finalTotalPrice = Math.max(0, roomChargesRaw - discountApplied);
    const depositRequired = Math.round(finalTotalPrice * depositRate);

    // 3. Khách vãng lai (Guest Checkout) logic
    let guestToken = null;
    let tokenExpiresAt = null;

    if (!userId) {
      if (!guestName || !guestEmail || !guestPhone) {
        throw new Error('Vui lòng cung cấp đầy đủ thông tin khách hàng vãng lai.');
      }
      guestToken = `gst_${crypto.randomBytes(16).toString('hex')}`;
      tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // Token có hạn trong 7 ngày
    }

    // 4. Tạo bản ghi Booking
    const booking = await tx.booking.create({
      data: {
        user_id: userId || null,
        room_id: selectedRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: numGuests,
        total_price: finalTotalPrice,
        deposit_amount: depositRequired,
        status: BookingStatus.PENDING_PAYMENT,
        special_requests: specialRequests || null,
        guest_name: guestName || null,
        guest_email: guestEmail || null,
        guest_phone: guestPhone || null,
        guest_token: guestToken,
        token_expires_at: tokenExpiresAt,
      },
    });

    // 5. Nếu áp dụng Promotion, tạo bản ghi liên kết BOOKING_PROMOTION
    if (appliedPromotionId) {
      await tx.bookingPromotion.create({
        data: {
          booking_id: booking.id,
          promotion_id: appliedPromotionId,
          discount_applied: discountApplied,
        },
      });
    }

    return {
      booking,
      roomNumber: selectedRoom.room_number,
      guestToken,
    };
  });
}
