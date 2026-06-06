import { prisma } from '../src/lib/prisma';
import { calculateBookingPrice } from '../src/lib/pricing';

async function testPricing() {
  console.log('🧪 Bắt đầu kiểm thử tính toán giá phòng động...');

  try {
    // 1. Lấy một loại phòng ngẫu nhiên từ database
    const roomType = await prisma.roomType.findFirst();
    if (!roomType) {
      console.log('❌ Lỗi: Không tìm thấy loại phòng nào trong database. Hãy chạy seed trước!');
      return;
    }

    console.log(`🏠 Loại phòng kiểm thử: ${roomType.name} (Giá cơ bản: ${Number(roomType.base_price).toLocaleString()} VND/đêm)`);

    // 2. Thiết lập dải ngày đặt phòng (3 đêm)
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2); // 2 ngày sau
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 3); // Ở 3 đêm

    console.log(`📅 Thời gian ở: từ ${checkIn.toDateString()} đến ${checkOut.toDateString()} (3 đêm)`);

    // 3. Tính toán giá phòng
    const priceDetails = await calculateBookingPrice(roomType.id, checkIn, checkOut);

    console.log('\n💵 Kết quả tính toán giá chi tiết:');
    console.log(`- Số đêm: ${priceDetails.nightsCount}`);
    console.log(`- Tổng tiền phòng (trước giảm): ${priceDetails.roomChargesRaw.toLocaleString()} VND`);
    console.log(`- Giảm giá áp dụng: ${priceDetails.discountApplied.toLocaleString()} VND`);
    console.log(`- Tổng cộng phải thanh toán: ${priceDetails.finalTotalPrice.toLocaleString()} VND`);
    console.log(`- Tiền cọc tối thiểu (${priceDetails.depositRate * 100}%): ${priceDetails.depositRequired.toLocaleString()} VND`);

    console.log('\n📊 Phân tích giá từng đêm (Breakdown):');
    priceDetails.priceBreakdown.forEach((night) => {
      console.log(`  + Ngày ${night.date}: ${night.priceApplied.toLocaleString()} VND ${night.isOverridden ? `(Giá override! Lý do: ${night.reason})` : '(Giá cơ bản)'}`);
    });

    console.log('\n✅ Kiểm thử tính giá phòng HOÀN TẤT THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi kiểm thử tính giá:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPricing();
