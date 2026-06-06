import React from 'react';
import { getSessionStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/dashboard/AdminLoginForm';
import { cookies } from 'next/headers';

export default async function AdminLoginPage() {
  const staff = await getSessionStaff();
  
  // Nếu đã đăng nhập hợp lệ với DB, chuyển hướng thẳng vào dashboard
  if (staff) {
    redirect('/admin');
  }

  // Nếu không lấy được staff hợp lệ nhưng cookie vẫn tồn tại (cookie rác sau khi seeding/truncate database)
  // thì tự động dọn dẹp cookie đó để tránh vòng lặp chuyển hướng ở middleware
  const cookieStore = await cookies();
  if (cookieStore.has('homestay_session')) {
    cookieStore.delete('homestay_session');
  }

  return <AdminLoginForm />;
}
