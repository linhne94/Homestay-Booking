import React from 'react';
import { prisma } from '@/lib/prisma';
import { getAvailableRoomTypes } from '@/lib/booking';
import HomeClient from '@/components/home/HomeClient';

// Cache page trong 60 giây
export const revalidate = 60;

export default async function HomePage() {
  let branches: any[] = [];
  let initialRoomTypes: any[] = [];

  try {
    // 1. Fetch tất cả chi nhánh đang hoạt động từ DB
    branches = await prisma.branch.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        phone: true,
        thumbnail_url: true,
      },
      orderBy: { name: 'asc' },
    });
  } catch (e) {
    console.error('⚠️ [Database Error] Không thể kết nối cơ sở dữ liệu để lấy danh sách chi nhánh:', e);
    // Fallback sang dữ liệu mẫu khi db lỗi
    branches = [
      {
        id: 'dalat-mock-id',
        name: 'Boutique Homestay - Chi Nhánh Đà Lạt (Demo)',
        city: 'Đà Lạt',
        address: '22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Thành phố Đà Lạt',
        phone: '0901234567',
        thumbnail_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'nhatrang-mock-id',
        name: 'Boutique Homestay - Chi Nhánh Nha Trang (Demo)',
        city: 'Nha Trang',
        address: '15 Đường Trần Phú, Lộc Thọ, Thành phố Nha Trang',
        phone: '0907654321',
        thumbnail_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      }
    ];
  }

  // 2. Fetch danh sách phòng trống mặc định cho chi nhánh đầu tiên
  if (branches.length > 0) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    try {
      if (branches[0].id !== 'dalat-mock-id') {
        initialRoomTypes = await getAvailableRoomTypes(branches[0].id, today, tomorrow);
      } else {
        // Mock rooms fallback
        initialRoomTypes = [
          {
            id: 'dalat-rt-1',
            name: 'Forest View Glass Cabin',
            max_guests: 2,
            base_price: 1500000.00,
            description: 'Căn cabin vách kính ôm trọn view thung lũng thông mờ sương tại Đà Lạt. Lý tưởng cho cặp đôi lãng mạn.',
            thumbnail_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
            availableRoomsCount: 3,
            pricing: { finalTotalPrice: 1500000.00, discountApplied: 0 },
            amenities: [
              { name: 'Wifi tốc độ cao' },
              { name: 'Bồn tắm nước nóng ngoài trời' },
              { name: 'Ban công ngắm mây' }
            ]
          },
          {
            id: 'dalat-rt-2',
            name: 'Rustic Warm Suite',
            max_guests: 4,
            base_price: 2500000.00,
            description: 'Căn Suite gỗ thông mộc mạc rộng rãi với lò sưởi đá sưởi ấm, bồn tắm gỗ sồi và hiên ngắm bình minh thung lũng.',
            thumbnail_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
            availableRoomsCount: 2,
            pricing: { finalTotalPrice: 2500000.00, discountApplied: 0 },
            amenities: [
              { name: 'Wifi tốc độ cao' },
              { name: 'Lò sưởi ấm cúng' },
              { name: 'Chỗ đỗ xe miễn phí' }
            ]
          }
        ];
      }
    } catch (e) {
      console.error('Lỗi lấy phòng trống ban đầu:', e);
    }
  }

  return (
    <HomeClient 
      branches={branches} 
      initialRoomTypes={JSON.parse(JSON.stringify(initialRoomTypes))} 
    />
  );
}
