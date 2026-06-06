'use client';

import React, { useState, useTransition } from 'react';
import { 
  Plus, Edit, Trash2, Users, Bed, CheckCircle, X, Loader2, Layers, CheckSquare, Square
} from 'lucide-react';
import { 
  createRoomTypeAction, 
  updateRoomTypeAction, 
  deleteRoomTypeAction,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction
} from '@/app/actions/room';

interface Room {
  id: string;
  room_type_id: string;
  room_number: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  notes: string | null;
}

interface RoomTypeData {
  id: string;
  branch_id: string;
  name: string;
  max_guests: number;
  base_price: any; // Decimal
  deposit_rate: any; // Decimal
  description: string;
  thumbnail_url: string;
  is_active: boolean;
  rooms: Room[];
  amenities: {
    amenity: {
      id: string;
      name: string;
      icon: string;
      category: string;
    };
  }[];
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface RoomsClientProps {
  initialRoomTypes: RoomTypeData[];
  isAdmin: boolean;
  branchId: string;
  allAmenities: Amenity[];
}

export default function RoomsClient({ 
  initialRoomTypes, 
  isAdmin, 
  branchId,
  allAmenities
}: RoomsClientProps) {
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>(initialRoomTypes);
  const [isRtModalOpen, setIsRtModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRt, setEditingRt] = useState<RoomTypeData | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRtForRoom, setSelectedRtForRoom] = useState<string>('');
  
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // RoomType Form states
  const [rtName, setRtName] = useState('');
  const [rtMaxGuests, setRtMaxGuests] = useState('2');
  const [rtBasePrice, setRtBasePrice] = useState('1000000');
  const [rtDepositRate, setRtDepositRate] = useState('0.5');
  const [rtDescription, setRtDescription] = useState('');
  const [rtThumbnailUrl, setRtThumbnailUrl] = useState('');
  const [rtIsActive, setRtIsActive] = useState(true);
  const [rtSelectedAmenities, setRtSelectedAmenities] = useState<string[]>([]);

  // Room Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomStatus, setRoomStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'>('AVAILABLE');
  const [roomNotes, setRoomNotes] = useState('');

  // Status options for quick update
  const statusOptions = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];

  // ==========================================
  // ROOM TYPE MODAL CONTROLS
  // ==========================================
  const openAddRtModal = () => {
    setEditingRt(null);
    setRtName('');
    setRtMaxGuests('2');
    setRtBasePrice('1000000');
    setRtDepositRate('0.5');
    setRtDescription('');
    setRtThumbnailUrl('');
    setRtIsActive(true);
    setRtSelectedAmenities([]);
    setError('');
    setIsRtModalOpen(true);
  };

  const openEditRtModal = (rt: RoomTypeData) => {
    setEditingRt(rt);
    setRtName(rt.name);
    setRtMaxGuests(String(rt.max_guests));
    setRtBasePrice(String(rt.base_price));
    setRtDepositRate(String(rt.deposit_rate));
    setRtDescription(rt.description);
    setRtThumbnailUrl(rt.thumbnail_url);
    setRtIsActive(rt.is_active);
    setRtSelectedAmenities(rt.amenities.map(a => a.amenity.id));
    setError('');
    setIsRtModalOpen(true);
  };

  const handleRtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('branch_id', branchId);
    formData.append('name', rtName);
    formData.append('max_guests', rtMaxGuests);
    formData.append('base_price', rtBasePrice);
    formData.append('deposit_rate', rtDepositRate);
    formData.append('description', rtDescription);
    formData.append('thumbnail_url', rtThumbnailUrl);
    formData.append('is_active', String(rtIsActive));
    
    rtSelectedAmenities.forEach(id => {
      formData.append('amenities', id);
    });

    startTransition(async () => {
      let res;
      if (editingRt) {
        res = await updateRoomTypeAction(editingRt.id, formData);
      } else {
        res = await createRoomTypeAction(formData);
      }

      if (res.success && res.roomType) {
        // Construct standard roomType state object
        const mappedAmenities = rtSelectedAmenities.map(id => {
          const found = allAmenities.find(a => a.id === id);
          return {
            amenity: found || { id, name: '', icon: '', category: '' }
          };
        });

        const newRt: RoomTypeData = {
          ...res.roomType,
          rooms: editingRt?.rooms || [],
          amenities: mappedAmenities as any
        };

        if (editingRt) {
          setRoomTypes(prev => prev.map(rt => rt.id === editingRt.id ? newRt : rt));
        } else {
          setRoomTypes(prev => [...prev, newRt]);
        }
        setIsRtModalOpen(false);
      } else {
        setError(res.error || 'Có lỗi xảy ra.');
      }
    });
  };

  const handleDeleteRt = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại phòng này? Thao tác này chỉ thực hiện được nếu không có phòng vật lý trực thuộc.')) return;

    startTransition(async () => {
      const res = await deleteRoomTypeAction(id);
      if (res.success) {
        setRoomTypes(prev => prev.filter(rt => rt.id !== id));
      } else {
        alert(res.error || 'Xóa loại phòng thất bại.');
      }
    });
  };

  // ==========================================
  // PHYSICAL ROOM MODAL CONTROLS
  // ==========================================
  const openAddRoomModal = (rtId: string) => {
    setEditingRoom(null);
    setSelectedRtForRoom(rtId);
    setRoomNumber('');
    setRoomFloor('1');
    setRoomStatus('AVAILABLE');
    setRoomNotes('');
    setError('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setSelectedRtForRoom(room.room_type_id);
    setRoomNumber(room.room_number);
    setRoomFloor(String(room.floor));
    setRoomStatus(room.status);
    setRoomNotes(room.notes || '');
    setError('');
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('room_type_id', selectedRtForRoom);
    formData.append('room_number', roomNumber);
    formData.append('floor', roomFloor);
    formData.append('status', roomStatus);
    formData.append('notes', roomNotes);

    startTransition(async () => {
      let res;
      if (editingRoom) {
        res = await updateRoomAction(editingRoom.id, formData);
      } else {
        res = await createRoomAction(formData);
      }

      if (res.success && res.room) {
        setRoomTypes(prev => prev.map(rt => {
          if (rt.id === selectedRtForRoom) {
            let updatedRooms = [...rt.rooms];
            if (editingRoom) {
              updatedRooms = updatedRooms.map(r => r.id === editingRoom.id ? res.room : r);
            } else {
              updatedRooms.push(res.room);
            }
            // Sort by room number asc
            updatedRooms.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
            return { ...rt, rooms: updatedRooms };
          }
          return rt;
        }));
        setIsRoomModalOpen(false);
      } else {
        setError(res.error || 'Có lỗi xảy ra.');
      }
    });
  };

  const handleDeleteRoom = async (rtId: string, roomId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;

    startTransition(async () => {
      const res = await deleteRoomAction(roomId);
      if (res.success) {
        setRoomTypes(prev => prev.map(rt => {
          if (rt.id === rtId) {
            return {
              ...rt,
              rooms: rt.rooms.filter(r => r.id !== roomId)
            };
          }
          return rt;
        }));
      } else {
        alert(res.error || 'Xóa phòng thất bại.');
      }
    });
  };

  // Quick update for room status
  const handleQuickStatusUpdate = async (roomId: string, rtId: string, newStatus: string) => {
    const formData = new FormData();
    const room = roomTypes.find(rt => rt.id === rtId)?.rooms.find(r => r.id === roomId);
    if (!room) return;

    formData.append('room_type_id', rtId);
    formData.append('room_number', room.room_number);
    formData.append('floor', String(room.floor));
    formData.append('status', newStatus);
    formData.append('notes', room.notes || '');

    startTransition(async () => {
      const res = await updateRoomAction(roomId, formData);
      if (res.success && res.room) {
        setRoomTypes(prev => prev.map(rt => {
          if (rt.id === rtId) {
            return {
              ...rt,
              rooms: rt.rooms.map(r => r.id === roomId ? res.room : r)
            };
          }
          return rt;
        }));
      } else {
        alert(res.error || 'Cập nhật trạng thái thất bại.');
      }
    });
  };

  const toggleAmenitySelection = (id: string) => {
    setRtSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-[#FAF9F6]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold">Quản Lý Phòng &amp; Loại Phòng</h1>
          <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">
            Quản lý cơ cấu phòng nghỉ, tiện ích và cập nhật trạng thái dọn dẹp vật lý của từng phòng
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddRtModal}
            className="flex items-center gap-1.5 bg-[#C5A880] hover:bg-[#b0936e] text-[#0B0C10] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" /> Thêm Loại Phòng
          </button>
        )}
      </div>

      {/* RoomTypes Accordion / List */}
      <div className="flex flex-col gap-8">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-6">
            
            {/* Room Type Details */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#232731]">
              <div className="flex gap-4 items-center min-w-0 flex-grow">
                <img 
                  src={rt.thumbnail_url} 
                  alt={rt.name} 
                  className="w-20 h-20 rounded-xl object-cover border border-[#232731] shrink-0"
                />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-lg font-bold text-[#FAF9F6] truncate pr-2">{rt.name}</h3>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditRtModal(rt)}
                          className="p-1 rounded bg-[#0B0C10]/40 border border-[#232731] text-[#FAF9F6]/75 hover:text-[#C5A880] hover:border-[#C5A880]/30 transition-all cursor-pointer"
                          title="Sửa loại phòng"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRt(rt.id)}
                          className="p-1 rounded bg-[#0B0C10]/40 border border-[#232731] text-[#FAF9F6]/75 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Xóa loại phòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5 text-[10px] text-[#FAF9F6]/55 font-medium uppercase tracking-wider items-center">
                    <span className="flex items-center gap-1 text-[#C5A880]"><Users className="w-3.5 h-3.5" /> Tối đa {rt.max_guests} khách</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-indigo-400" /> {rt.rooms.length} phòng thực tế</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded ${rt.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {rt.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#FAF9F6]/40 uppercase tracking-widest font-semibold block">Giá cơ bản / đêm</span>
                <span className="font-extrabold text-[#C5A880] text-lg block mt-0.5">{Number(rt.base_price).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Grid of actual rooms */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#FAF9F6]/50 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C5A880]" /> Danh sách phòng vật lý
                </h4>
                {isAdmin && (
                  <button
                    onClick={() => openAddRoomModal(rt.id)}
                    className="flex items-center gap-1 bg-[#FAF9F6]/5 border border-[#232731] hover:border-[#C5A880]/30 hover:bg-[#C5A880]/5 text-[#C5A880] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Phòng
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rt.rooms.map((room) => (
                  <div key={room.id} className="bg-[#0B0C10]/40 border border-[#232731] rounded-xl p-4 flex flex-col gap-4 relative group/room">
                    
                    {/* Admin delete & edit room actions hover overlay */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/room:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="p-1 rounded bg-[#161920] border border-[#232731] text-[#FAF9F6]/75 hover:text-[#C5A880] hover:border-[#C5A880]/30 transition-all cursor-pointer"
                          title="Sửa phòng"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(rt.id, room.id)}
                          className="p-1 rounded bg-[#161920] border border-[#232731] text-[#FAF9F6]/75 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Xóa phòng"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pr-12">
                      <span className="text-xs font-black text-[#FAF9F6]">Phòng {room.room_number}</span>
                      <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        room.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : room.status === 'OCCUPIED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : room.status === 'CLEANING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#FAF9F6]/50 font-light truncate leading-none">
                      Tầng {room.floor} {room.notes ? `• ${room.notes}` : ''}
                    </div>

                    {/* Quick status toggle dropdown */}
                    <div className="flex gap-2">
                      <select 
                        name="status"
                        value={room.status}
                        onChange={(e) => handleQuickStatusUpdate(room.id, rt.id, e.target.value)}
                        className="flex-grow bg-[#161920] border border-[#232731] rounded-lg px-2 py-1 text-[10px] font-bold text-[#FAF9F6]/80 outline-none cursor-pointer focus:border-[#C5A880]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                
                {rt.rooms.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-[#FAF9F6]/35 italic border border-dashed border-[#232731] rounded-xl bg-[#0B0C10]/15">
                    Chưa có phòng vật lý nào được thêm vào loại phòng này.
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ==========================================
          ROOMTYPE CRUD MODAL
      ========================================== */}
      {isRtModalOpen && (
        <div className="fixed inset-0 bg-[#0B0C10]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-2xl w-full bg-[#161920] border border-[#232731] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-y-auto max-h-[90vh]">
            
            <button 
              onClick={() => setIsRtModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full border border-[#232731] bg-[#0B0C10]/50 text-[#FAF9F6]/60 hover:text-[#C5A880] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF9F6]">
                {editingRt ? 'Cập Nhật Loại Phòng' : 'Thêm Loại Phòng Mới'}
              </h2>
              <p className="text-[10px] text-[#FAF9F6]/50">
                {editingRt ? 'Thay đổi các cấu hình cơ bản, giá cả và tiện ích của loại phòng' : 'Tạo mới một dòng phòng nghỉ cao cấp với các tiện ích đặc thù'}
              </p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleRtSubmit} className="flex flex-col gap-4">
              {/* Row 1: Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Tên Loại Phòng <span className="text-[#C5A880]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rtName}
                  onChange={(e) => setRtName(e.target.value)}
                  placeholder="Ví dụ: Forest View Glass Cabin"
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                />
              </div>

              {/* Row 2: Price, Guests, Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Giá Cơ Bản / Đêm (VND) <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rtBasePrice}
                    onChange={(e) => setRtBasePrice(e.target.value)}
                    placeholder="1500000"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Số Khách Tối Đa <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={rtMaxGuests}
                    onChange={(e) => setRtMaxGuests(e.target.value)}
                    placeholder="2"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Tỷ Lệ Đặt Cọc (0.0 đến 1.0) <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.05"
                    min="0"
                    max="1"
                    value={rtDepositRate}
                    onChange={(e) => setRtDepositRate(e.target.value)}
                    placeholder="0.50"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Row 3: Thumbnail URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Ảnh Đại Diện (URL) <span className="text-[#C5A880]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={rtThumbnailUrl}
                  onChange={(e) => setRtThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                />
              </div>

              {/* Row 4: Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Mô Tả Chi Tiết Không Gian
                </label>
                <textarea
                  rows={3}
                  value={rtDescription}
                  onChange={(e) => setRtDescription(e.target.value)}
                  placeholder="Vách kính nhìn ra đồi thông..."
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6] resize-none"
                />
              </div>

              {/* Row 5: Amenities Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Tiện Nghi Kèm Theo Loại Phòng
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#0B0C10]/40 p-3 rounded-xl border border-[#232731]/50 max-h-40 overflow-y-auto scrollbar-thin">
                  {allAmenities.map((amenity) => {
                    const isSelected = rtSelectedAmenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenitySelection(amenity.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left text-[10px] font-semibold border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#C5A880]/10 border-[#C5A880] text-[#C5A880]' 
                            : 'bg-[#161920]/45 border-[#232731] text-[#FAF9F6]/70 hover:border-[#FAF9F6]/20'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{amenity.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rt-is-active"
                  checked={rtIsActive}
                  onChange={(e) => setRtIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#232731] bg-[#0B0C10] text-[#C5A880] focus:ring-[#C5A880] focus:ring-opacity-20 cursor-pointer"
                />
                <label htmlFor="rt-is-active" className="text-[10px] font-bold uppercase tracking-wider text-[#FAF9F6]/75 cursor-pointer">
                  Mở bán trực tuyến ngay lập tức
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#232731]/50 mt-2">
                <button
                  type="button"
                  onClick={() => setIsRtModalOpen(false)}
                  className="bg-[#0B0C10]/40 border border-[#232731] hover:bg-[#FAF9F6]/5 text-[#FAF9F6]/80 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-[#C5A880] hover:bg-[#b0936e] disabled:opacity-55 text-[#0B0C10] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-all active:scale-98"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    editingRt ? 'Cập Nhật' : 'Tạo Mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          ROOM CRUD MODAL
      ========================================== */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-[#0B0C10]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-[#161920] border border-[#232731] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative">
            
            <button 
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full border border-[#232731] bg-[#0B0C10]/50 text-[#FAF9F6]/60 hover:text-[#C5A880] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF9F6]">
                {editingRoom ? 'Cập Nhật Phòng Vật Lý' : 'Thêm Phòng Vật Lý'}
              </h2>
              <p className="text-[10px] text-[#FAF9F6]/50">
                {editingRoom ? 'Chỉnh sửa thông tin phòng vật lý hiện có' : 'Khởi tạo mã phòng nghỉ vật lý khớp với sơ đồ thực tế của Homestay'}
              </p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleRoomSubmit} className="flex flex-col gap-4">
              
              {/* Row 1: Room Number & Floor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Số Phòng <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Ví dụ: 101, A2"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Tầng <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(e.target.value)}
                    placeholder="1"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Row 2: Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Trạng Thái Khởi Tạo
                </label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value as any)}
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]/85 cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Ghi Chú Phòng (Ví dụ: view vườn hoa, gần sảnh...)
                </label>
                <input
                  type="text"
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#232731]/50 mt-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="bg-[#0B0C10]/40 border border-[#232731] hover:bg-[#FAF9F6]/5 text-[#FAF9F6]/80 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-[#C5A880] hover:bg-[#b0936e] disabled:opacity-55 text-[#0B0C10] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl cursor-pointer transition-all active:scale-98"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    editingRoom ? 'Cập Nhật' : 'Tạo Mới'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
