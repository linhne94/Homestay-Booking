import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RoomsClient from '@/components/dashboard/RoomsClient';

export default async function AdminRoomsPage() {
  const staff = await getSessionStaff();
  
  if (!staff) {
    redirect('/admin/login');
  }

  const branchId = staff.staff_profile.branch_id;

  // Lấy các RoomTypes thuộc chi nhánh kèm Rooms tương ứng, Amenities liên kết và Room Images
  const roomTypes = await prisma.roomType.findMany({
    where: { branch_id: branchId },
    include: {
      rooms: {
        orderBy: { room_number: 'asc' }
      },
      amenities: {
        include: {
          amenity: true
        }
      },
      room_images: {
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { base_price: 'asc' }
  });

  // Lấy tất cả tiện ích có sẵn trong hệ thống để chọn khi thêm/sửa RoomType
  const allAmenities = await prisma.amenity.findMany({
    orderBy: { name: 'asc' }
  });

  // Định dạng lại các kiểu dữ liệu Decimal thành chuỗi/số trước khi chuyển qua Client Component
  const formattedRoomTypes = roomTypes.map((rt) => ({
    ...rt,
    base_price: Number(rt.base_price),
    deposit_rate: Number(rt.deposit_rate),
    amenities: rt.amenities.map(rta => ({
      amenity: {
        id: rta.amenity.id,
        name: rta.amenity.name,
        icon: rta.amenity.icon,
        category: rta.amenity.category
      }
    })),
    room_images: rt.room_images.map(img => ({
      id: img.id,
      image_url: img.image_url,
      sort_order: img.sort_order
    }))
  }));

  const isAdmin = staff.staff_profile.role === 'ADMIN';

  return (
    <RoomsClient 
      initialRoomTypes={formattedRoomTypes as any}
      isAdmin={isAdmin}
      branchId={branchId}
      allAmenities={allAmenities}
    />
  );
}
