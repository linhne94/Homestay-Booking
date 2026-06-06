import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  // 1. Kiểm tra session đăng nhập
  const user = await getSessionUser();

  if (!user) {
    return redirect('/login?redirectTo=/dashboard');
  }

  // 2. Fetch danh sách booking của user
  const bookings = await prisma.booking.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    include: {
      room: {
        include: {
          room_type: {
            include: {
              branch: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
        },
      },
    },
  });

  // 3. Fetch danh sách giao dịch điểm thưởng
  const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  });

  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      bookings={JSON.parse(JSON.stringify(bookings))}
      loyaltyTransactions={JSON.parse(JSON.stringify(loyaltyTransactions))}
    />
  );
}
