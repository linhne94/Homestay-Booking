'use client';

import React, { useState, useTransition } from 'react';
import { 
  Plus, Edit, Trash2, MapPin, Phone, Mail, CheckCircle2, XCircle, X, Loader2 
} from 'lucide-react';
import { 
  createBranchAction, 
  updateBranchAction, 
  deleteBranchAction, 
  toggleBranchStatusAction 
} from '@/app/actions/branch';

interface BranchData {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  thumbnail_url: string;
  is_active: boolean;
  _count?: {
    room_types: number;
    staffs: number;
  };
}

interface BranchesClientProps {
  initialBranches: BranchData[];
  currentStaffBranchId?: string;
}

export default function BranchesClient({ initialBranches, currentStaffBranchId }: BranchesClientProps) {
  const [branches, setBranches] = useState<BranchData[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('0');
  const [longitude, setLongitude] = useState('0');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setCity('');
    setLatitude('0');
    setLongitude('0');
    setPhone('');
    setEmail('');
    setThumbnailUrl('');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (branch: BranchData) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address);
    setCity(branch.city);
    setLatitude(String(branch.latitude));
    setLongitude(String(branch.longitude));
    setPhone(branch.phone);
    setEmail(branch.email);
    setThumbnailUrl(branch.thumbnail_url);
    setIsActive(branch.is_active);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('thumbnail_url', thumbnailUrl);
    formData.append('is_active', String(isActive));

    startTransition(async () => {
      let res;
      if (editingBranch) {
        res = await updateBranchAction(editingBranch.id, formData);
      } else {
        res = await createBranchAction(formData);
      }

      if (res.success && res.branch) {
        const updatedBranch: BranchData = {
          ...res.branch,
          latitude: Number(res.branch.latitude),
          longitude: Number(res.branch.longitude),
          _count: editingBranch?._count || { room_types: 0, staffs: 0 }
        };

        if (editingBranch) {
          setBranches(prev => prev.map(b => b.id === editingBranch.id ? updatedBranch : b));
        } else {
          setBranches(prev => [...prev, updatedBranch]);
        }
        setIsModalOpen(false);
      } else {
        setError(res.error || 'Có lỗi xảy ra.');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) return;

    startTransition(async () => {
      const res = await deleteBranchAction(id);
      if (res.success) {
        setBranches(prev => prev.filter(b => b.id !== id));
      } else {
        alert(res.error || 'Xóa chi nhánh thất bại.');
      }
    });
  };

  const handleToggleStatus = async (branch: BranchData) => {
    startTransition(async () => {
      const res = await toggleBranchStatusAction(branch.id, branch.is_active);
      if (res.success && res.branch) {
        setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, is_active: res.branch.is_active } : b));
      } else {
        alert(res.error || 'Thay đổi trạng thái thất bại.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-[#FAF9F6]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold">Quản Lý Chi Nhánh</h1>
          <p className="text-xs text-[#FAF9F6]/55 font-light mt-0.5">Quản lý và cập nhật danh sách các cơ sở Homestay Galophy</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-[#C5A880] hover:bg-[#b0936e] text-[#0B0C10] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" /> Thêm Chi Nhánh
        </button>
      </div>

      {/* Grid of branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className={`bg-[#161920] border rounded-2xl p-6 flex flex-col gap-5 hover:border-[#C5A880]/30 transition-all duration-300 relative overflow-hidden ${
              branch.id === currentStaffBranchId ? 'border-[#C5A880]/40 shadow-lg shadow-[#C5A880]/5' : 'border-[#232731]'
            }`}
          >
            {branch.id === currentStaffBranchId && (
              <div className="absolute top-0 right-0 bg-[#C5A880] text-[#0B0C10] text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl">
                Cơ sở làm việc của bạn
              </div>
            )}

            {/* Title & Image banner */}
            <div className="flex gap-4 items-center">
              <img 
                src={branch.thumbnail_url} 
                alt={branch.name} 
                className="w-16 h-16 rounded-xl object-cover border border-[#232731] shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <h3 className="font-serif text-lg font-bold truncate pr-16">{branch.name}</h3>
                <span className="text-[10px] text-[#C5A880] font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {branch.city}
                </span>
              </div>
            </div>

            {/* Detailed metadata */}
            <div className="flex flex-col gap-2.5 bg-[#0B0C10]/40 p-4 rounded-xl border border-[#232731]/50 text-xs font-light text-[#FAF9F6]/75">
              <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> <span className="truncate">{branch.address}</span></span>
              <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> {branch.phone}</span>
              <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C5A880]/70 shrink-0" /> {branch.email}</span>
            </div>

            {/* Quick stats and action */}
            <div className="flex justify-between items-center pt-3 border-t border-[#232731]/70 text-xs">
              <div className="flex gap-4 text-[#FAF9F6]/50 text-[10px] font-bold uppercase tracking-wider items-center">
                <span>{branch._count?.room_types || 0} loại phòng</span>
                <span>•</span>
                <span>{branch._count?.staffs || 0} nhân viên</span>
              </div>

              {/* Status & CRUD Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(branch)}
                  className="p-1.5 rounded-lg border border-[#232731] bg-[#0B0C10]/50 text-[#FAF9F6]/70 hover:text-[#C5A880] hover:border-[#C5A880]/30 transition-all cursor-pointer"
                  title="Sửa chi nhánh"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="p-1.5 rounded-lg border border-[#232731] bg-[#0B0C10]/50 text-[#FAF9F6]/70 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                  title="Xóa chi nhánh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                
                <button 
                  onClick={() => handleToggleStatus(branch)}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors ${
                    branch.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {branch.is_active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Hoạt động
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Tạm dừng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sleek Obsidian Dark Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B0C10]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-xl w-full bg-[#161920] border border-[#232731] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-y-auto max-h-[90vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full border border-[#232731] bg-[#0B0C10]/50 text-[#FAF9F6]/60 hover:text-[#C5A880] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF9F6]">
                {editingBranch ? 'Cập Nhật Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
              </h2>
              <p className="text-[10px] text-[#FAF9F6]/50">
                {editingBranch ? 'Cập nhật lại các thông tin của chi nhánh hiện tại' : 'Điền đầy đủ thông tin để khởi tạo chi nhánh vận hành mới'}
              </p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Row 1: Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Tên Chi Nhánh <span className="text-[#C5A880]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Boutique Homestay - Chi Nhánh Đà Lạt"
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                />
              </div>

              {/* Row 2: Address & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Địa Chỉ Chi Tiết <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="22 Đường Khởi Nghĩa Bắc Sơn, Phường 10"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Thành Phố <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Đà Lạt"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Row 3: Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Vĩ Độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="11.9333"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Kinh Độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="108.4500"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Số Điện Thoại <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                    Email Liên Hệ <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dalat@galophy.com"
                    className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Row 5: Thumbnail URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
                  Ảnh Đại Diện (URL) <span className="text-[#C5A880]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0B0C10] border border-[#232731] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none font-medium text-[#FAF9F6]"
                />
              </div>

              {/* Row 6: Active Status Toggle */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="modal-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#232731] bg-[#0B0C10] text-[#C5A880] focus:ring-[#C5A880] focus:ring-opacity-20 cursor-pointer"
                />
                <label htmlFor="modal-is-active" className="text-[10px] font-bold uppercase tracking-wider text-[#FAF9F6]/75 cursor-pointer">
                  Kích hoạt trạng thái hoạt động ngay lập tức
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#232731]/50 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    editingBranch ? 'Cập Nhật' : 'Tạo Mới'
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
