import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncOtaCalendar } from '@/lib/ical';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');

    const secureKey = process.env.OTA_SYNC_API_KEY || 'your-secure-cron-job-api-key-here';

    // 1. Kiểm tra mã API key bảo mật
    if (!apiKey || apiKey !== secureKey) {
      return NextResponse.json({ status: 401, error: 'Unauthorized. Khóa bảo mật không chính xác.' });
    }

    // 2. Tìm tất cả các mapping phòng OTA đang bật tính năng đồng bộ
    const activeMappings = await prisma.otaRoomMapping.findMany({
      where: { sync_enabled: true },
      select: { id: true, room_type: { select: { name: true } }, ota_channel: { select: { name: true } } },
    });

    console.log(`[iCal Sync Cron] Bắt đầu đồng bộ cho ${activeMappings.length} kênh OTA...`);

    const summaryResults = [];
    let successCount = 0;

    // 3. Chạy đồng bộ tuần tự/đồng thời cho từng phòng
    for (const mapping of activeMappings) {
      const result = await syncOtaCalendar(mapping.id);
      
      summaryResults.push({
        mappingId: mapping.id,
        channel: mapping.ota_channel.name,
        roomType: mapping.room_type.name,
        success: result.success,
        eventsSynced: result.eventsSynced,
        error: result.error,
      });

      if (result.success) {
        successCount++;
      }
    }

    return NextResponse.json({
      status: 200,
      message: `Đồng bộ hoàn tất! Thành công: ${successCount}/${activeMappings.length}`,
      details: summaryResults,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 500, error: 'System Error: ' + error.message });
  }
}
