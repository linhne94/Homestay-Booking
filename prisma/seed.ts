import { PrismaClient, RoomStatus, UserRole, StaffRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import crypto from 'crypto';

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'homestay-booking-secret-key-eco-luxury-2026';

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seeding database)...');

  // Clear existing data in reverse order of dependencies
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ROOM_TYPE_AMENITY" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AMENITY" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ROOM" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ROOM_IMAGE" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "PRICE_OVERRIDE" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "PROMOTION" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BLACKOUT_DATE" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "STAFF" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "USER" CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BRANCH" CASCADE;`);

  console.log('🧹 Đã dọn sạch các bảng dữ liệu cũ.');

  // ==========================================
  // 1. SEED CHI NHÁNH (BRANCH)
  // ==========================================
  const branchDaLat = await prisma.branch.create({
    data: {
      name: 'Boutique Homestay - Chi Nhánh Đà Lạt',
      address: '22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Thành phố Đà Lạt',
      city: 'Đà Lạt',
      latitude: 11.9333,
      longitude: 108.4500,
      phone: '0901234567',
      email: 'dalat@galophy.com',
      thumbnail_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const branchNhaTrang = await prisma.branch.create({
    data: {
      name: 'Boutique Homestay - Chi Nhánh Nha Trang',
      address: '15 Đường Trần Phú, Lộc Thọ, Thành phố Nha Trang',
      city: 'Nha Trang',
      latitude: 12.2389,
      longitude: 109.1961,
      phone: '0907654321',
      email: 'nhatrang@galophy.com',
      thumbnail_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    },
  });

  console.log('✅ Đã nạp 2 Chi nhánh.');

  // ==========================================
  // 2. SEED TIỆN ÍCH (AMENITY)
  // ==========================================
  const amenitiesData = [
    { name: 'Wifi tốc độ cao', icon: 'Wifi', category: 'Room Amenities' },
    { name: 'Bồn tắm nước nóng ngoài trời', icon: 'Bath', category: 'Room Amenities' },
    { name: 'Lò sưởi ấm cúng', icon: 'Flame', category: 'Room Amenities' },
    { name: 'Ban công ngắm mây', icon: 'Compass', category: 'Room Amenities' },
    { name: 'Smart TV 4K', icon: 'Tv', category: 'Room Amenities' },
    { name: 'Bếp nướng BBQ ngoài trời', icon: 'ChefHat', category: 'Shared Facilities' },
    { name: 'Hồ bơi vô cực', icon: 'Waves', category: 'Shared Facilities' },
    { name: 'Chỗ đỗ xe miễn phí', icon: 'Car', category: 'Shared Facilities' },
  ];

  const amenities: any[] = [];
  for (const item of amenitiesData) {
    const created = await prisma.amenity.create({ data: item });
    amenities.push(created);
  }

  console.log(`✅ Đã nạp ${amenities.length} Tiện ích.`);

  // ==========================================
  // 3. SEED LOẠI PHÒNG (ROOM_TYPE)
  // ==========================================
  // --- Chi nhánh Đà Lạt ---
  const rtDalat1 = await prisma.roomType.create({
    data: {
      branch_id: branchDaLat.id,
      name: 'Forest View Glass Cabin',
      max_guests: 2,
      base_price: 1500000.00, // 1.5M VND
      deposit_rate: 0.50,     // cọc 50%
      description: 'Căn cabin vách kính ôm trọn view thung lũng thông mờ sương tại Đà Lạt. Lý tưởng cho cặp đôi lãng mạn.',
      thumbnail_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    },
  });

  const rtDalat2 = await prisma.roomType.create({
    data: {
      branch_id: branchDaLat.id,
      name: 'Rustic Warm Suite',
      max_guests: 4,
      base_price: 2500000.00, // 2.5M VND
      deposit_rate: 0.50,
      description: 'Căn Suite gỗ thông mộc mạc rộng rãi với lò sưởi đá sưởi ấm, bồn tắm gỗ sồi và hiên ngắm bình minh thung lũng.',
      thumbnail_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    },
  });

  // --- Chi nhánh Nha Trang ---
  const rtNhaTrang1 = await prisma.roomType.create({
    data: {
      branch_id: branchNhaTrang.id,
      name: 'Infinity Pool Ocean Villa',
      max_guests: 2,
      base_price: 3200000.00, // 3.2M VND
      deposit_rate: 0.50,
      description: 'Villa sang trọng view biển Nha Trang trực diện, lối đi riêng thẳng ra hồ bơi vô cực và bãi tắm cát trắng.',
      thumbnail_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    },
  });

  console.log('✅ Đã nạp 3 Loại phòng.');

  // ==========================================
  // 4. ÁNH XẠ TIỆN ÍCH VÀO PHÒNG (ROOM_TYPE_AMENITY)
  // ==========================================
  // Gán Wifi, Bồn tắm, Lò sưởi, Ban công cho Cabin Đà Lạt
  await prisma.roomTypeAmenity.createMany({
    data: [
      { room_type_id: rtDalat1.id, amenity_id: amenities[0].id }, // Wifi
      { room_type_id: rtDalat1.id, amenity_id: amenities[1].id }, // Bồn tắm
      { room_type_id: rtDalat1.id, amenity_id: amenities[2].id }, // Lò sưởi
      { room_type_id: rtDalat1.id, amenity_id: amenities[3].id }, // Ban công
    ],
  });

  // Gán Wifi, Bếp nướng BBQ, Chỗ đỗ xe cho Ocean Villa Nha Trang
  await prisma.roomTypeAmenity.createMany({
    data: [
      { room_type_id: rtNhaTrang1.id, amenity_id: amenities[0].id }, // Wifi
      { room_type_id: rtNhaTrang1.id, amenity_id: amenities[5].id }, // BBQ
      { room_type_id: rtNhaTrang1.id, amenity_id: amenities[6].id }, // Hồ bơi
      { room_type_id: rtNhaTrang1.id, amenity_id: amenities[7].id }, // Đỗ xe
    ],
  });

  console.log('✅ Đã gán Tiện ích vào các Loại phòng.');

  // ==========================================
  // 5. SEED ALBUM ẢNH PHÒNG (ROOM_IMAGE)
  // ==========================================
  await prisma.roomImage.createMany({
    data: [
      { room_type_id: rtDalat1.id, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', sort_order: 1 },
      { room_type_id: rtDalat1.id, image_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80', sort_order: 2 },
      { room_type_id: rtNhaTrang1.id, image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', sort_order: 1 },
    ],
  });

  console.log('✅ Đã nạp Album ảnh chi tiết loại phòng.');

  // ==========================================
  // 6. SEED SỐ PHÒNG THỰC TẾ (ROOM)
  // ==========================================
  await prisma.room.createMany({
    data: [
      // Cabin Đà Lạt (Loại rtDalat1) - 3 phòng
      { room_type_id: rtDalat1.id, room_number: '101', floor: 1, status: RoomStatus.AVAILABLE },
      { room_type_id: rtDalat1.id, room_number: '102', floor: 1, status: RoomStatus.AVAILABLE },
      { room_type_id: rtDalat1.id, room_number: '103', floor: 1, status: RoomStatus.MAINTENANCE, notes: 'Bảo trì kính nứt góc trái' },
      
      // Suite Gỗ Đà Lạt (Loại rtDalat2) - 2 phòng
      { room_type_id: rtDalat2.id, room_number: '201', floor: 2, status: RoomStatus.AVAILABLE },
      { room_type_id: rtDalat2.id, room_number: '202', floor: 2, status: RoomStatus.OCCUPIED },

      // Ocean Villa Nha Trang (Loại rtNhaTrang1) - 2 phòng
      { room_type_id: rtNhaTrang1.id, room_number: 'V01', floor: 1, status: RoomStatus.AVAILABLE },
      { room_type_id: rtNhaTrang1.id, room_number: 'V02', floor: 1, status: RoomStatus.AVAILABLE },
    ],
  });

  console.log('✅ Đã nạp 7 Số phòng thực tế.');

  // ==========================================
  // 7. SEED NGƯỜI DÙNG & NHÂN VIÊN (USER & STAFF)
  // ==========================================
  // Tài khoản Admin tối cao
  const userAdmin = await prisma.user.create({
    data: {
      full_name: 'Vũ Homestay Admin',
      email: 'admin@homestay.com',
      phone: '0988888888',
      password_hash: hashPassword('admin123'),
      role: UserRole.ADMIN,
      loyalty_points: 0,
    },
  });

  await prisma.staff.create({
    data: {
      user_id: userAdmin.id,
      branch_id: branchDaLat.id,
      role: StaffRole.ADMIN,
    },
  });

  // Tài khoản nhân viên lễ tân Đà Lạt
  const userStaffDalat = await prisma.user.create({
    data: {
      full_name: 'Nguyễn Thị Lễ Tân',
      email: 'le-tan.dalat@homestay.com',
      phone: '0977777777',
      password_hash: hashPassword('admin123'),
      role: UserRole.STAFF,
      loyalty_points: 0,
    },
  });

  await prisma.staff.create({
    data: {
      user_id: userStaffDalat.id,
      branch_id: branchDaLat.id,
      role: StaffRole.RECEPTIONIST,
    },
  });

  // Tài khoản thành viên mẫu (Khách hàng)
  const userCustomer = await prisma.user.create({
    data: {
      full_name: 'Trần Văn Khách Hàng',
      email: 'khachhang@gmail.com',
      phone: '0966666666',
      password_hash: hashPassword('admin123'),
      role: UserRole.CUSTOMER,
      loyalty_points: 500, // Tích lũy sẵn 500 điểm
    },
  });

  console.log('✅ Đã nạp 3 tài khoản người dùng mẫu (Admin, Lễ tân Đà Lạt, Khách hàng).');

  console.log('🎉 Nạp dữ liệu mẫu (Seeding) đã hoàn tất THÀNH CÔNG!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi nạp dữ liệu mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
