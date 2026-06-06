import React from 'react';
import { prisma } from '@/lib/prisma';
import GuestPortalClient from '@/components/guest-portal/GuestPortalClient';

export default async function GuestPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let initialBooking = null;

  if (token) {
    // Truy vấn booking bằng guest_token
    try {
      const dbBooking = await prisma.booking.findUnique({
        where: { guest_token: token },
        include: {
          room: {
            include: {
              room_type: {
                include: {
                  branch: {
                    select: {
                      name: true,
                      city: true,
                      address: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (dbBooking) {
        initialBooking = dbBooking;
      }
    } catch (e) {
      console.error('Lỗi tra cứu booking bằng token:', e);
    }
  }

  return (
    <GuestPortalClient
      initialBooking={initialBooking ? JSON.parse(JSON.stringify(initialBooking)) : null}
      token={token || null}
    />
  );
}
