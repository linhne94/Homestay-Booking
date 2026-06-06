import { prisma } from './prisma';
import { BookingStatus, RoomStatus } from '@prisma/client';

/**
 * Xuất danh sách đặt phòng của một Room (hoặc RoomType) thành chuỗi lịch iCal (.ics) chuẩn RFC 5545
 */
export async function generateRoomIcal(roomTypeId: string): Promise<string> {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      rooms: {
        include: {
          bookings: {
            where: {
              status: {
                in: [
                  BookingStatus.CONFIRMED,
                  BookingStatus.CHECKED_IN,
                  BookingStatus.CHECKED_OUT,
                  BookingStatus.PENDING_PAYMENT,
                ],
              },
            },
          },
        },
      },
    },
  });

  if (!roomType) {
    throw new Error('Không tìm thấy loại phòng.');
  }

  // Thu thập tất cả các booking hợp lệ của tất cả các phòng thuộc loại phòng này
  const bookings = roomType.rooms.flatMap((r) => r.bookings);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Galophy//Homestay Booking System//VN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Lịch bận - ${roomType.name}`,
  ];

  const formatDateToIcsDate = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  };

  const formatDateTimeToIcsDateTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}Z`;
  };

  const nowStr = formatDateTimeToIcsDateTime(new Date());

  for (const b of bookings) {
    const startStr = formatDateToIcsDate(new Date(b.check_in));
    const endStr = formatDateToIcsDate(new Date(b.check_out));
    const guestName = b.guest_name || b.user_id || 'Khách hàng';

    ics.push(
      'BEGIN:VEVENT',
      `UID:${b.id}@galophy.com`,
      `DTSTAMP:${nowStr}`,
      `DTSTART;VALUE=DATE:${startStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:Bận - Đặt phòng Galophy (${guestName})`,
      `DESCRIPTION:Mã đặt phòng: ${b.id}\\nNguồn: Direct booking`,
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export interface IcalEvent {
  uid?: string;
  startDate: Date;
  endDate: Date;
  summary: string;
}

/**
 * Phân tích cú pháp tệp iCal (.ics) thô một cách an toàn và trích xuất các dải ngày bận
 */
export function parseIcalContent(icalContent: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  const lines = icalContent.split(/\r?\n/);
  
  let currentEvent: Partial<IcalEvent> = {};
  let inEvent = false;

  const parseIcsDate = (str: string): Date | null => {
    // Định dạng phổ biến: VALUE=DATE:20260525 hoặc 20260525T120000Z hoặc 20260525
    const dateMatch = str.match(/(\d{4})(\d{2})(\d{2})/);
    if (!dateMatch) return null;
    
    const [_, y, m, d] = dateMatch;
    // Tạo đối tượng Date lúc 12:00 trưa để tránh lệch múi giờ khi lưu vào cột kiểu DATE trong DB
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (inEvent && currentEvent.startDate && currentEvent.endDate) {
        events.push({
          uid: currentEvent.uid || `ota_${Math.random().toString(36).substr(2, 9)}`,
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate,
          summary: currentEvent.summary || 'Đặt phòng OTA',
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmed.startsWith('UID:')) {
        currentEvent.uid = trimmed.substring(4);
      } else if (trimmed.startsWith('SUMMARY:')) {
        currentEvent.summary = trimmed.substring(8);
      } else if (trimmed.startsWith('DTSTART')) {
        const value = trimmed.split(':')[1] || '';
        const parsed = parseIcsDate(value);
        if (parsed) currentEvent.startDate = parsed;
      } else if (trimmed.startsWith('DTEND')) {
        const value = trimmed.split(':')[1] || '';
        const parsed = parseIcsDate(value);
        if (parsed) currentEvent.endDate = parsed;
      }
    }
  }

  return events;
}

/**
 * Đồng bộ lịch từ một URL liên kết iCal (e.g. Airbnb, Booking.com) vào bảng BlackoutDate dưới dạng ngày bận của OTA
 */
export async function syncOtaCalendar(otaMappingId: string): Promise<{ success: boolean; eventsSynced: number; error?: string }> {
  try {
    const mapping = await prisma.otaRoomMapping.findUnique({
      where: { id: otaMappingId },
      include: {
        room_type: true,
        ota_channel: true,
      },
    });

    if (!mapping || !mapping.sync_enabled) {
      return { success: false, eventsSynced: 0, error: 'Mapping không tồn tại hoặc tính năng đồng bộ bị tắt.' };
    }

    const otaUrl = mapping.external_room_id; // Lưu URL iCal của đối tác tại trường này
    if (!otaUrl.startsWith('http')) {
      return { success: false, eventsSynced: 0, error: 'URL liên kết iCal của OTA không hợp lệ.' };
    }

    // 1. Tải nội dung iCal (.ics) của đối tác
    const response = await fetch(otaUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      throw new Error(`Cổng OTA phản hồi lỗi HTTP ${response.status}`);
    }

    const icsContent = await response.text();

    // 2. Parse tệp iCal lấy các dải ngày bận
    const events = parseIcalContent(icsContent);

    // 3. Tiến hành ghi nhận vào BlackoutDate của chi nhánh tương ứng
    // Dọn các bản ghi cũ của kênh OTA này trên loại phòng này để ghi lại bản mới nhất
    const branchId = mapping.room_type.branch_id;
    const reasonPrefix = `[OTA Sync - ${mapping.ota_channel.name}]`;

    await prisma.$transaction(async (tx) => {
      // Xóa các ngày bận cũ của kênh này
      await tx.blackoutDate.deleteMany({
        where: {
          branch_id: branchId,
          reason: { startsWith: reasonPrefix },
        },
      });

      // Tạo các bản ghi ngày bận mới
      for (const ev of events) {
        await tx.blackoutDate.create({
          data: {
            branch_id: branchId,
            date_from: ev.startDate,
            date_to: ev.endDate,
            reason: `${reasonPrefix} ${ev.summary} (UID: ${ev.uid})`,
          },
        });
      }

      // Log lịch sử thành công
      await tx.otaSyncLog.create({
        data: {
          ota_room_mapping_id: mapping.id,
          action: 'sync_availability_import',
          status: 'SUCCESS',
          payload: `Đã xử lý ${events.length} sự kiện bận từ OTA`,
          response: 'Đồng bộ hoàn tất thành công!',
        },
      });
    });

    return { success: true, eventsSynced: events.length };
  } catch (err: any) {
    // Ghi log thất bại
    try {
      await prisma.otaSyncLog.create({
        data: {
          ota_room_mapping_id: otaMappingId,
          action: 'sync_availability_import',
          status: 'FAILED',
          payload: 'Lỗi trong quá trình đồng bộ hóa',
          response: err.message || 'Lỗi không xác định',
        },
      });
    } catch (_) {}

    return { success: false, eventsSynced: 0, error: err.message };
  }
}
