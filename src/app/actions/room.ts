'use server';

import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { RoomStatus } from '@prisma/client';

async function requireAdmin() {
  const staff = await getSessionStaff();
  if (!staff || staff.staff_profile.role !== 'ADMIN') {
    throw new Error('Bạn không có quyền thực hiện hành động này. Chỉ có Admin mới có quyền.');
  }
  return staff;
}

// ==========================================
// ROOM TYPE ACTIONS
// ==========================================

export async function createRoomTypeAction(formData: FormData) {
  try {
    await requireAdmin();

    const branchId = formData.get('branch_id') as string;
    const name = formData.get('name') as string;
    const maxGuests = parseInt(formData.get('max_guests') as string || '2');
    const basePrice = parseFloat(formData.get('base_price') as string || '0');
    const depositRate = parseFloat(formData.get('deposit_rate') as string || '0.5');
    const description = formData.get('description') as string;
    const thumbnailUrl = formData.get('thumbnail_url') as string;
    const isActive = formData.get('is_active') === 'true';

    // Get checked amenity IDs
    const checkedAmenityIds = formData.getAll('amenities') as string[];

    if (!branchId || !name || !basePrice || !thumbnailUrl) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin: chi nhánh, tên loại phòng, giá và ảnh đại diện.' };
    }

    const roomType = await prisma.roomType.create({
      data: {
        branch_id: branchId,
        name,
        max_guests: maxGuests,
        base_price: basePrice,
        deposit_rate: depositRate,
        description: description || '',
        thumbnail_url: thumbnailUrl,
        is_active: isActive,
      },
    });

    // Link amenities
    if (checkedAmenityIds.length > 0) {
      await prisma.roomTypeAmenity.createMany({
        data: checkedAmenityIds.map((amenityId) => ({
          room_type_id: roomType.id,
          amenity_id: amenityId,
        })),
      });
    }

    // Link additional room images
    const roomImages = formData.getAll('room_images') as string[];
    if (roomImages.length > 0) {
      await prisma.roomImage.createMany({
        data: roomImages.map((imageUrl, idx) => ({
          room_type_id: roomType.id,
          image_url: imageUrl,
          sort_order: idx,
        })),
      });
    }

    revalidatePath('/admin/rooms');
    return { success: true, roomType };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi tạo loại phòng.' };
  }
}

export async function updateRoomTypeAction(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const branchId = formData.get('branch_id') as string;
    const name = formData.get('name') as string;
    const maxGuests = parseInt(formData.get('max_guests') as string || '2');
    const basePrice = parseFloat(formData.get('base_price') as string || '0');
    const depositRate = parseFloat(formData.get('deposit_rate') as string || '0.5');
    const description = formData.get('description') as string;
    const thumbnailUrl = formData.get('thumbnail_url') as string;
    const isActive = formData.get('is_active') === 'true';

    // Get checked amenity IDs
    const checkedAmenityIds = formData.getAll('amenities') as string[];

    if (!branchId || !name || !basePrice || !thumbnailUrl) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin: chi nhánh, tên loại phòng, giá và ảnh đại diện.' };
    }

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        branch_id: branchId,
        name,
        max_guests: maxGuests,
        base_price: basePrice,
        deposit_rate: depositRate,
        description: description || '',
        thumbnail_url: thumbnailUrl,
        is_active: isActive,
      },
    });

    // Sync amenities: delete old ones first
    await prisma.roomTypeAmenity.deleteMany({
      where: { room_type_id: id },
    });

    // Insert new ones
    if (checkedAmenityIds.length > 0) {
      await prisma.roomTypeAmenity.createMany({
        data: checkedAmenityIds.map((amenityId) => ({
          room_type_id: id,
          amenity_id: amenityId,
        })),
      });
    }

    // Sync room images: delete old ones first, then insert new ones
    const roomImages = formData.getAll('room_images') as string[];
    await prisma.roomImage.deleteMany({
      where: { room_type_id: id },
    });
    if (roomImages.length > 0) {
      await prisma.roomImage.createMany({
        data: roomImages.map((imageUrl, idx) => ({
          room_type_id: id,
          image_url: imageUrl,
          sort_order: idx,
        })),
      });
    }

    revalidatePath('/admin/rooms');
    return { success: true, roomType };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi cập nhật loại phòng.' };
  }
}

export async function deleteRoomTypeAction(id: string) {
  try {
    await requireAdmin();

    // Check if there are physical rooms linked
    const roomsCount = await prisma.room.count({
      where: { room_type_id: id },
    });

    if (roomsCount > 0) {
      return { success: false, error: 'Không thể xóa loại phòng này vì có phòng vật lý đang thuộc loại phòng này.' };
    }

    await prisma.roomType.delete({
      where: { id },
    });

    revalidatePath('/admin/rooms');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi xóa loại phòng.' };
  }
}

// ==========================================
// PHYSICAL ROOM ACTIONS
// ==========================================

export async function createRoomAction(formData: FormData) {
  try {
    await requireAdmin();

    const roomTypeId = formData.get('room_type_id') as string;
    const roomNumber = formData.get('room_number') as string;
    const floor = parseInt(formData.get('floor') as string || '1');
    const status = (formData.get('status') as RoomStatus) || RoomStatus.AVAILABLE;
    const notes = formData.get('notes') as string;

    if (!roomTypeId || !roomNumber || isNaN(floor)) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin: số phòng, tầng và loại phòng.' };
    }

    const room = await prisma.room.create({
      data: {
        room_type_id: roomTypeId,
        room_number: roomNumber,
        floor,
        status,
        notes: notes || '',
      },
    });

    revalidatePath('/admin/rooms');
    return { success: true, room };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi tạo phòng vật lý.' };
  }
}

export async function updateRoomAction(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const roomTypeId = formData.get('room_type_id') as string;
    const roomNumber = formData.get('room_number') as string;
    const floor = parseInt(formData.get('floor') as string || '1');
    const status = (formData.get('status') as RoomStatus) || RoomStatus.AVAILABLE;
    const notes = formData.get('notes') as string;

    if (!roomTypeId || !roomNumber || isNaN(floor)) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin: số phòng, tầng và loại phòng.' };
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        room_type_id: roomTypeId,
        room_number: roomNumber,
        floor,
        status,
        notes: notes || '',
      },
    });

    revalidatePath('/admin/rooms');
    return { success: true, room };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi cập nhật phòng vật lý.' };
  }
}

export async function deleteRoomAction(id: string) {
  try {
    await requireAdmin();

    // Check if there are active bookings linked to this room
    const activeBookingsCount = await prisma.booking.count({
      where: { 
        room_id: id,
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'] }
      },
    });

    if (activeBookingsCount > 0) {
      return { success: false, error: 'Không thể xóa phòng này vì đang có đặt phòng chưa hoàn thành.' };
    }

    await prisma.room.delete({
      where: { id },
    });

    revalidatePath('/admin/rooms');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi xóa phòng vật lý.' };
  }
}
