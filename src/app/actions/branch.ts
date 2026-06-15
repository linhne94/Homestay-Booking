'use server';

import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to check if current user is admin
async function requireAdmin() {
  const staff = await getSessionStaff();
  if (!staff || staff.staff_profile.role !== 'ADMIN') {
    throw new Error('Bạn không có quyền thực hiện hành động này. Chỉ có Admin mới có quyền.');
  }
  return staff;
}

export async function createBranchAction(formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0');
    const longitude = parseFloat(formData.get('longitude') as string || '0');
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const thumbnailUrl = formData.get('thumbnail_url') as string;
    const isActive = formData.get('is_active') === 'true';

    if (!name || !address || !city || !phone || !email || !thumbnailUrl) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin chi nhánh.' };
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        city,
        latitude,
        longitude,
        phone,
        email,
        thumbnail_url: thumbnailUrl,
        is_active: isActive,
      },
    });

    revalidatePath('/admin/branches');
    return { success: true, branch };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi tạo chi nhánh.' };
  }
}

export async function updateBranchAction(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const latitude = parseFloat(formData.get('latitude') as string || '0');
    const longitude = parseFloat(formData.get('longitude') as string || '0');
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const thumbnailUrl = formData.get('thumbnail_url') as string;
    const isActive = formData.get('is_active') === 'true';

    if (!name || !address || !city || !phone || !email || !thumbnailUrl) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin chi nhánh.' };
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        address,
        city,
        latitude,
        longitude,
        phone,
        email,
        thumbnail_url: thumbnailUrl,
        is_active: isActive,
      },
    });

    revalidatePath('/admin/branches');
    return { success: true, branch };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi cập nhật chi nhánh.' };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    await requireAdmin();

    // Check if there are any rooms/bookings linked
    const roomsCount = await prisma.roomType.count({
      where: { branch_id: id },
    });

    if (roomsCount > 0) {
      return { success: false, error: 'Không thể xóa chi nhánh này vì đã có loại phòng hoặc dữ liệu liên kết.' };
    }

    await prisma.branch.delete({
      where: { id },
    });

    revalidatePath('/admin/branches');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi xóa chi nhánh.' };
  }
}

export async function toggleBranchStatusAction(id: string, isActive: boolean) {
  try {
    await requireAdmin();

    const branch = await prisma.branch.update({
      where: { id },
      data: { is_active: !isActive },
    });

    revalidatePath('/admin/branches');
    return { success: true, branch };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi thay đổi trạng thái chi nhánh.' };
  }
}

export async function switchBranchAction(branchId: string) {
  try {
    const staff = await getSessionStaff();
    if (!staff) {
      return { success: false, error: 'Chưa đăng nhập.' };
    }
    if (staff.staff_profile.role !== 'ADMIN') {
      return { success: false, error: 'Bạn không có quyền thực hiện hành động này. Chỉ có Admin mới được phép đổi chi nhánh.' };
    }

    // Kiểm tra xem chi nhánh có tồn tại không
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });
    if (!branch) {
      return { success: false, error: 'Chi nhánh không tồn tại.' };
    }

    await prisma.staff.update({
      where: { id: staff.staff_profile.id },
      data: { branch_id: branchId }
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Có lỗi xảy ra khi thay đổi chi nhánh.' };
  }
}

