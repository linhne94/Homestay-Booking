import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RoomDetailClient from '@/components/rooms/RoomDetailClient';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  // 1. Dữ liệu mẫu (mock) cho Room Detail khi db lỗi hoặc dùng ID demo
  const mockRoomTypes: Record<string, any> = {
    'dalat-rt-1': {
      id: 'dalat-rt-1',
      name: 'Forest View Glass Cabin',
      max_guests: 2,
      base_price: 1500000.00,
      description: 'Căn cabin vách kính ôm trọn view thung lũng thông mờ sương tại Đà Lạt. Lý tưởng cho cặp đôi lãng mạn. Trải nghiệm không gian nghỉ dưỡng biệt lập cao cấp, hòa mình vào thiên nhiên hoang sơ.',
      thumbnail_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      is_active: true,
      branch: {
        id: 'dalat-mock-id',
        name: 'Boutique Homestay - Chi Nhánh Đà Lạt (Demo)',
        city: 'Đà Lạt',
        address: '22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Thành phố Đà Lạt',
      },
      room_images: [
        { image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
        { image_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80' },
      ],
      amenities: [
        { amenity: { name: 'Wifi tốc độ cao', icon: 'Wifi', category: 'Room Amenities' } },
        { amenity: { name: 'Bồn tắm nước nóng ngoài trời', icon: 'Bath', category: 'Room Amenities' } },
        { amenity: { name: 'Ban công ngắm mây', icon: 'Compass', category: 'Room Amenities' } }
      ],
      reviews: [
        {
          id: 'review-1',
          rating_overall: 5,
          rating_cleanliness: 5,
          rating_service: 5,
          rating_location: 5,
          comment: 'Trải nghiệm tuyệt vời! Cảnh quan đồi thông buổi sáng rất đẹp.',
          created_at: new Date().toISOString(),
          user: {
            full_name: 'Nguyễn Văn A',
            avatar_url: null,
          }
        }
      ]
    },
    'dalat-rt-2': {
      id: 'dalat-rt-2',
      name: 'Rustic Warm Suite',
      max_guests: 4,
      base_price: 2500000.00,
      description: 'Căn Suite gỗ thông mộc mạc rộng rãi với lò sưởi đá sưởi ấm, bồn tắm gỗ sồi và hiên ngắm bình minh thung lũng. Phù hợp cho nhóm bạn hoặc gia đình nhỏ.',
      thumbnail_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      is_active: true,
      branch: {
        id: 'dalat-mock-id',
        name: 'Boutique Homestay - Chi Nhánh Đà Lạt (Demo)',
        city: 'Đà Lạt',
        address: '22 Đường Khởi Nghĩa Bắc Sơn, Phường 10, Thành phố Đà Lạt',
      },
      room_images: [
        { image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80' },
      ],
      amenities: [
        { amenity: { name: 'Wifi tốc độ cao', icon: 'Wifi', category: 'Room Amenities' } },
        { amenity: { name: 'Lò sưởi ấm cúng', icon: 'Flame', category: 'Room Amenities' } },
        { amenity: { name: 'Chỗ đỗ xe miễn phí', icon: 'Car', category: 'Shared Facilities' } }
      ],
      reviews: []
    }
  };

  // Nếu là ID demo, trả về trực tiếp mock data
  if (mockRoomTypes[id]) {
    return (
      <RoomDetailClient 
        roomType={JSON.parse(JSON.stringify(mockRoomTypes[id]))} 
      />
    );
  }

  try {
    // Lấy chi tiết RoomType từ Database
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
        room_images: {
          orderBy: { sort_order: 'asc' },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!roomType || !roomType.is_active) {
      return notFound();
    }

    // Tách truy vấn review do Review không liên kết trực tiếp với RoomType trong Prisma Schema
    const reviews = await prisma.review.findMany({
      where: {
        is_visible: true,
        booking: {
          room: {
            room_type_id: id,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    const roomTypeWithReviews = {
      ...roomType,
      reviews,
    };

    return (
      <RoomDetailClient 
        roomType={JSON.parse(JSON.stringify(roomTypeWithReviews))} 
      />
    );
  } catch (e) {
    console.error('⚠️ [Database Error] Không thể kết nối cơ sở dữ liệu để lấy chi tiết phòng:', e);
    // Nếu kết nối DB lỗi nhưng người dùng đang truy cập một phòng thật, fallback sang cabin demo
    return (
      <RoomDetailClient 
        roomType={JSON.parse(JSON.stringify(mockRoomTypes['dalat-rt-1']))} 
      />
    );
  }
}
