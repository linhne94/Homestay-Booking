import { prisma } from './prisma';

export interface PricingDetails {
  basePricePerNight: number;
  nightsCount: number;
  roomChargesRaw: number; // Tổng tiền phòng trước giảm giá
  discountApplied: number; // Số tiền được giảm
  finalTotalPrice: number; // Tổng tiền thanh toán cuối cùng
  depositRequired: number; // Số tiền cọc cần trả trước
  depositRate: number; // Tỷ lệ cọc (e.g. 0.5)
  promoAppliedCode?: string;
  priceBreakdown: {
    date: string;
    originalPrice: number;
    priceApplied: number;
    isOverridden: boolean;
    reason?: string;
  }[];
}

/**
 * Chuẩn hóa Date về dạng YYYY-MM-DD dạng chuỗi để so sánh chính xác
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tính toán giá phòng động (dynamic pricing) cho một loại phòng trong khoảng ngày chỉ định
 */
export async function calculateBookingPrice(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  promoCode?: string
): Promise<PricingDetails> {
  // 1. Lấy thông tin RoomType và các quy tắc PriceOverride liên quan
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      price_overrides: {
        where: {
          date_to: { gte: checkInDate },
          date_from: { lte: checkOutDate },
        },
      },
    },
  });

  if (!roomType) {
    throw new Error('Không tìm thấy loại phòng yêu cầu.');
  }

  const basePrice = Number(roomType.base_price);
  const depositRate = Number(roomType.deposit_rate);

  // 2. Tính số đêm
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (nightsCount <= 0) {
    throw new Error('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.');
  }

  // 3. Tính giá cho từng đêm
  const priceBreakdown: PricingDetails['priceBreakdown'] = [];
  let roomChargesRaw = 0;

  for (let i = 0; i < nightsCount; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(checkInDate.getDate() + i);
    const dateStr = formatDateKey(currentDate);

    // Tìm xem ngày này có PriceOverride nào áp dụng không
    // Cần so sánh ngày không tính giờ
    const override = roomType.price_overrides.find((ov) => {
      const from = new Date(ov.date_from);
      const to = new Date(ov.date_to);
      
      // Chuyển đổi về YYYY-MM-DD để so sánh không bị lệch múi giờ
      const fromStr = formatDateKey(from);
      const toStr = formatDateKey(to);
      
      return dateStr >= fromStr && dateStr <= toStr;
    });

    if (override) {
      const overriddenPrice = Number(override.price);
      priceBreakdown.push({
        date: dateStr,
        originalPrice: basePrice,
        priceApplied: overriddenPrice,
        isOverridden: true,
        reason: override.reason,
      });
      roomChargesRaw += overriddenPrice;
    } else {
      priceBreakdown.push({
        date: dateStr,
        originalPrice: basePrice,
        priceApplied: basePrice,
        isOverridden: false,
      });
      roomChargesRaw += basePrice;
    }
  }

  // 4. Kiểm tra và áp dụng khuyến mãi
  let discountApplied = 0;
  let promoAppliedCode = undefined;

  if (promoCode) {
    const promotion = await prisma.promotion.findUnique({
      where: { code: promoCode.toUpperCase() },
    });

    if (
      promotion &&
      promotion.is_active &&
      new Date(promotion.valid_from) <= checkInDate &&
      new Date(promotion.valid_to) >= checkOutDate
    ) {
      // Kiểm tra số đêm tối thiểu
      const minNights = promotion.min_nights || 1;
      const isUsageAvailable = promotion.usage_limit === null || promotion.usage_limit > 0;

      if (nightsCount >= minNights && isUsageAvailable) {
        // Áp dụng chiết khấu phần trăm hoặc cố định
        if (promotion.discount_pct) {
          const pct = Number(promotion.discount_pct) / 100;
          let calculatedDiscount = roomChargesRaw * pct;

          // Giới hạn giảm giá tối đa nếu có
          if (promotion.max_discount) {
            const maxD = Number(promotion.max_discount);
            if (calculatedDiscount > maxD) {
              calculatedDiscount = maxD;
            }
          }
          discountApplied = calculatedDiscount;
          promoAppliedCode = promotion.code;
        } else if (promotion.discount_flat) {
          discountApplied = Number(promotion.discount_flat);
          promoAppliedCode = promotion.code;
        }
      }
    }
  }

  // 5. Tính toán tổng cộng và cọc
  const finalTotalPrice = Math.max(0, roomChargesRaw - discountApplied);
  const depositRequired = Math.round(finalTotalPrice * depositRate);

  return {
    basePricePerNight: basePrice,
    nightsCount,
    roomChargesRaw,
    discountApplied,
    finalTotalPrice,
    depositRequired,
    depositRate,
    promoAppliedCode,
    priceBreakdown,
  };
}
