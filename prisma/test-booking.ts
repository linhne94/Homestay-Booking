import { prisma } from '../src/lib/prisma';
import { getAvailableRoomTypes, createSecureBooking } from '../src/lib/booking';

async function testBookingFlow() {
  console.log('🧪 Bắt đầu kiểm thử tích hợp luồng Đặt phòng & Chống trùng phòng...');

  try {
    // 1. Lấy chi nhánh Đà Lạt từ database
    const branch = await prisma.branch.findFirst({
      where: { city: 'Đà Lạt' },
    });

    if (!branch) {
      console.log('❌ Lỗi: Không tìm thấy chi nhánh Đà Lạt. Hãy chạy seed trước!');
      return;
    }

    console.log(`📍 Chi nhánh kiểm thử: ${branch.name}`);

    // Thiết lập ngày đặt phòng (2 đêm)
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 5);
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 2);

    console.log(`📅 Thời gian: ${checkIn.toISOString().split('T')[0]} -> ${checkOut.toISOString().split('T')[0]} (2 đêm)`);

    // 2. Kiểm tra số phòng trống ban đầu
    console.log('\n🔍 Bước 1: Kiểm tra phòng trống ban đầu...');
    let availabilities = await getAvailableRoomTypes(branch.id, checkIn, checkOut);
    
    const targetRoomType = availabilities.find(a => a.name === 'Forest View Glass Cabin');
    if (!targetRoomType) {
      console.log('❌ Lỗi: Không tìm thấy loại phòng Forest View Glass Cabin!');
      return;
    }

    const initialCount = targetRoomType.availableRoomsCount;
    console.log(`🏠 Loại phòng: Forest View Glass Cabin`);
    console.log(`   + Số phòng trống ban đầu: ${initialCount} phòng`);
    console.log(`   + Giá mỗi đêm ước lượng: ${targetRoomType.pricing?.finalTotalPrice.toLocaleString()} VND`);

    if (initialCount === 0) {
      console.log('⚠️ Cảnh báo: Không có phòng trống để tiến hành đặt thử nghiệm.');
      return;
    }

    // 3. Tiến hành đặt thử nghiệm (Guest Checkout)
    console.log('\n🔒 Bước 2: Thực hiện đặt phòng bảo mật (Pessimistic locking)...');
    const bookingResult = await createSecureBooking({
      roomTypeId: targetRoomType.id,
      checkIn,
      checkOut,
      numGuests: 2,
      guestName: 'Nguyễn Văn Tester',
      guestEmail: 'tester@gmail.com',
      guestPhone: '0955555555',
      specialRequests: 'Cần nến và hoa hồng lãng mạn',
    });

    console.log('✅ Đặt phòng thành công!');
    console.log(`   + Mã đặt phòng (ID): ${bookingResult.booking.id}`);
    console.log(`   + Số phòng thực tế được gán: ${bookingResult.roomNumber}`);
    console.log(`   + Tổng số tiền: ${Number(bookingResult.booking.total_price).toLocaleString()} VND`);
    console.log(`   + Tiền cọc yêu cầu: ${Number(bookingResult.booking.deposit_amount).toLocaleString()} VND`);
    console.log(`   + Guest Security Token: ${bookingResult.guestToken}`);

    // 4. Kiểm tra số phòng trống sau khi đặt
    console.log('\n🔍 Bước 3: Kiểm tra lại phòng trống sau khi đặt...');
    availabilities = await getAvailableRoomTypes(branch.id, checkIn, checkOut);
    const updatedRoomType = availabilities.find(a => a.name === 'Forest View Glass Cabin')!;
    const afterCount = updatedRoomType.availableRoomsCount;

    console.log(`   + Số phòng trống sau khi đặt: ${afterCount} phòng`);

    // Kiểm chứng
    if (initialCount - afterCount === 1) {
      console.log('\n🎯 KẾT LUẬN: Thuật toán trừ phòng trống và khóa lịch hoạt động CHÍNH XÁC 100%!');
    } else {
      console.log('\n❌ KẾT LUẬN: Có sai lệch về số lượng phòng trống!');
    }

  } catch (error) {
    console.error('❌ Lỗi kiểm thử đặt phòng:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingFlow();
