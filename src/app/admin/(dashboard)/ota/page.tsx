import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { syncOtaCalendar } from '@/lib/ical';
import { RefreshCw, Plus, Link as LinkIcon, AlertCircle, Database, HelpCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminOtaPage() {
  const staff = await getSessionStaff();
  const branchId = staff?.staff_profile.branch_id;

  if (!branchId) {
    return <div className="text-red-400">Không xác định được chi nhánh của bạn.</div>;
  }

  // Lấy các channels và mappings thực tế
  const channels = await prisma.otaChannel.findMany({ where: { is_active: true } });
  const roomTypes = await prisma.roomType.findMany({ where: { branch_id: branchId } });

  const mappings = await prisma.otaRoomMapping.findMany({
    where: { room_type: { branch_id: branchId } },
    include: {
      room_type: { select: { name: true } },
      ota_channel: { select: { name: true } },
      sync_logs: {
        orderBy: { synced_at: 'desc' },
        take: 1
      }
    }
  });

  // Lấy các logs đồng bộ gần đây
  const syncLogs = await prisma.otaSyncLog.findMany({
    where: { ota_room_mapping: { room_type: { branch_id: branchId } } },
    include: {
      ota_room_mapping: {
        select: {
          room_type: { select: { name: true } },
          ota_channel: { select: { name: true } }
        }
      }
    },
    orderBy: { synced_at: 'desc' },
    take: 8
  });

  // Server Action tạo Mapping OTA mới
  const handleCreateMapping = async (formData: FormData) => {
    'use server';
    const roomTypeId = formData.get('roomTypeId') as string;
    const otaChannelId = formData.get('otaChannelId') as string;
    const externalRoomId = formData.get('externalRoomId') as string; // đây là link iCal OTA của đối tác
    const markupPct = Number(formData.get('markupPct') || 0);

    if (!roomTypeId || !otaChannelId || !externalRoomId) return;

    await prisma.otaRoomMapping.create({
      data: {
        room_type_id: roomTypeId,
        ota_channel_id: otaChannelId,
        external_room_id: externalRoomId,
        price_markup_pct: markupPct,
        sync_enabled: true
      }
    });

    revalidatePath('/admin/ota');
  };

  // Server Action kích hoạt đồng bộ hóa nóng
  const handleSyncImmediately = async (formData: FormData) => {
    'use server';
    const mappingId = formData.get('mappingId') as string;
    if (!mappingId) return;

    await syncOtaCalendar(mappingId);
    revalidatePath('/admin/ota');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* Cấu hình mapping OTA */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Form liên kết phòng OTA */}
        <div className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C5A880]" /> Liên Kết Đồng Bộ OTA
            </h2>
            <p className="text-[10px] text-[#FAF9F6]/55 font-light leading-relaxed">
              Thiết lập đồng bộ lịch đặt phòng tự động (2 chiều qua iCal) với Airbnb, Booking.com hoặc Agoda.
            </p>
          </div>

          <form action={handleCreateMapping} className="flex flex-col gap-4">
            
            {/* Room Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Loại Phòng Trong Hệ Thống</label>
              <select 
                name="roomTypeId"
                required
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880] cursor-pointer"
              >
                <option value="">Chọn loại phòng...</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            {/* OTA Channel */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Kênh OTA Liên Kết</label>
              <select 
                name="otaChannelId"
                required
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880] cursor-pointer"
              >
                <option value="">Chọn kênh đối tác...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>

            {/* iCal Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Đường Dẫn iCal Đối Tác (.ics URL)</label>
              <div className="relative">
                <input 
                  type="url"
                  name="externalRoomId"
                  required
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl pl-10 pr-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
                />
                <LinkIcon className="w-4 h-4 text-[#C5A880] absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Markup Pct */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAF9F6]/75">Phụ Thu Tỷ Lệ Giá Trên Kênh (%)</label>
              <input 
                type="number"
                name="markupPct"
                placeholder="5"
                defaultValue="0"
                className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-3 text-xs outline-none text-[#FAF9F6] focus:border-[#C5A880]"
              />
            </div>

            <button 
              type="submit"
              className="w-full h-11 bg-[#C5A880] hover:bg-[#b0936e] text-[#0B0C10] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow mt-2 cursor-pointer"
            >
              Thiết Lập Liên Kết
            </button>
          </form>
        </div>

        {/* Link xuất lịch hệ thống */}
        <div className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="font-serif text-sm font-bold text-[#FAF9F6] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#C5A880]" /> Lấy Link iCal Xuất Bản
          </h3>
          <p className="text-[10px] text-[#FAF9F6]/60 leading-relaxed font-light">
            Bạn cần cung cấp URL lịch của Galophy để Airbnb/Booking quét chặn phòng trống ngược lại. Link mẫu:
          </p>
          {roomTypes.map((rt) => (
            <div key={rt.id} className="p-2 bg-[#0B0C10] border border-[#232731] rounded-lg text-[9px] text-[#C5A880] break-all select-all font-mono font-medium">
              https://galophy.com/api/ota/export?roomTypeId={rt.id}
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách Mappings & Logs */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Danh sách Mapping */}
        <div className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6]">Các Phòng Đang Đồng Bộ</h2>
          
          <div className="flex flex-col gap-4">
            {mappings.length === 0 ? (
              <div className="text-center text-xs text-[#FAF9F6]/40 italic py-8 border border-dashed border-[#232731] rounded-xl">
                Chưa có liên kết phòng OTA nào được tạo.
              </div>
            ) : (
              mappings.map((m) => (
                <div key={m.id} className="bg-[#0B0C10]/40 border border-[#232731] p-4 rounded-xl flex justify-between items-center hover:border-[#C5A880]/10 transition-all">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-bold text-[#FAF9F6]">{m.room_type.name}</span>
                    <span className="text-[10px] text-[#C5A880] font-semibold uppercase tracking-wider">{m.ota_channel.name} • Phụ thu +{Number(m.price_markup_pct)}%</span>
                    <span className="text-[9px] text-[#FAF9F6]/50 truncate max-w-sm block">URL iCal: {m.external_room_id}</span>
                  </div>

                  <form action={handleSyncImmediately}>
                    <input type="hidden" name="mappingId" value={m.id} />
                    <button 
                      type="submit"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ ngay
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sync logs */}
        <div className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-serif text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#C5A880]" /> Nhật Ký Đồng Bộ Lịch
          </h2>
          
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#232731] pr-2">
            {syncLogs.length === 0 ? (
              <div className="text-center text-xs text-[#FAF9F6]/40 italic py-8">
                Chưa có lịch sử đồng bộ hóa nào được ghi lại.
              </div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-[#0B0C10]/40 border border-[#232731] rounded-xl flex justify-between items-center text-[10px] font-light">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[#FAF9F6]">
                      {log.ota_room_mapping.room_type.name} ({log.ota_room_mapping.ota_channel.name})
                    </span>
                    <span className="text-[#FAF9F6]/50 text-[9px]">{log.payload || 'Không có chi tiết'}</span>
                  </div>
                  <div className="text-right flex flex-col gap-0.5">
                    <span className={`font-extrabold uppercase tracking-wider ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.status}
                    </span>
                    <span className="text-[#FAF9F6]/40 text-[8px]">{new Date(log.synced_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
