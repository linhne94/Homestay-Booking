import { NextResponse } from 'next/server';
import { generateRoomIcal } from '@/lib/ical';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomTypeId = searchParams.get('roomTypeId');

    if (!roomTypeId) {
      return new NextResponse('Thiếu tham số roomTypeId', { status: 400 });
    }

    const icsContent = await generateRoomIcal(roomTypeId);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="galophy_room_${roomTypeId}.ics"`,
      },
    });
  } catch (error: any) {
    return new NextResponse('Lỗi máy chủ: ' + error.message, { status: 500 });
  }
}
