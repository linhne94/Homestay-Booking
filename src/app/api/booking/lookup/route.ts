import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { bookingId, phone } = await request.json();

    if (!bookingId || !phone) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin tra cứu.' }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guest_phone: phone,
      },
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

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hóa đơn đặt phòng khớp.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
