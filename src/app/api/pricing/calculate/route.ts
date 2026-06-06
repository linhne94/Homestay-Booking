import { NextResponse } from 'next/server';
import { calculateBookingPrice } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const { roomTypeId, checkInStr, checkOutStr, promoCode } = await request.json();

    if (!roomTypeId || !checkInStr || !checkOutStr) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số bắt buộc.' }, { status: 400 });
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json({ success: false, error: 'Ngày tháng không hợp lệ.' }, { status: 400 });
    }

    const pricing = await calculateBookingPrice(roomTypeId, checkIn, checkOut, promoCode);

    return NextResponse.json({ success: true, data: pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
