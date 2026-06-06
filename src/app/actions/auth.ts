'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!email || !password) {
    return { success: false, error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.is_active) {
      return { success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa.' };
    }

    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return { success: false, error: 'Mật khẩu không chính xác.' };
    }

    // Sinh token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Lưu cookie
    const cookieStore = await cookies();
    cookieStore.set('homestay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: '/',
    });

    return { 
      success: true, 
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role },
      redirectTo 
    };
  } catch (error: any) {
    return { success: false, error: 'Đã xảy ra lỗi hệ thống: ' + error.message };
  }
}

export async function registerAction(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  if (!fullName || !email || !password) {
    return { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' };
  }

  try {
    // Kiểm tra email trùng
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return { success: false, error: 'Email này đã được sử dụng.' };
    }

    const hashedPassword = hashPassword(password);

    // Tạo user mới dạng CUSTOMER
    const user = await prisma.user.create({
      data: {
        full_name: fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
      },
    });

    // Sinh token và lưu cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('homestay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: '/',
    });

    return { 
      success: true, 
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role } 
    };
  } catch (error: any) {
    return { success: false, error: 'Đăng ký thất bại: ' + error.message };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('homestay_session');
}
