import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calculateBookingPrice } from '@/lib/pricing';
import { getSessionUser } from '@/lib/auth';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    roomTypeId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
}) {
  const { roomTypeId, checkIn, checkOut, guests } = await searchParams;

  if (!roomTypeId || !checkIn || !checkOut) {
    return redirect('/');
  }

  // 1. Query chi tiết loại phòng và chi nhánh
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      branch: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  if (!roomType || !roomType.is_active) {
    return notFound();
  }

  // 2. Lấy thông tin user đăng nhập (nếu có)
  const user = await getSessionUser();

  // 3. Tính giá sơ bộ ban đầu
  let initialPricing = null;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  try {
    initialPricing = await calculateBookingPrice(roomType.id, inDate, outDate);
  } catch (err: any) {
    return (
      <div className="max-w-md mx-auto my-32 text-center bg-white p-8 rounded-3xl border border-[#1E463C]/10 shadow-lg text-[#1E463C]">
        <h2 className="font-serif text-2xl font-bold mb-4">Lỗi Đặt Lịch</h2>
        <p className="text-sm font-light text-red-500 mb-6">{err.message}</p>
        <a href="/" className="px-6 py-3 bg-[#1E463C] text-[#FAF9F6] rounded-xl text-xs font-bold uppercase tracking-wider">
          Quay lại trang chủ
        </a>
      </div>
    );
  }

  const guestsCount = guests ? Number(guests) : 2;

  return (
    <CheckoutClient
      roomType={JSON.parse(JSON.stringify(roomType))}
      checkInStr={checkIn}
      checkOutStr={checkOut}
      guestsCount={guestsCount}
      initialPricing={JSON.parse(JSON.stringify(initialPricing))}
      user={user ? JSON.parse(JSON.stringify(user)) : null}
    />
  );
}
