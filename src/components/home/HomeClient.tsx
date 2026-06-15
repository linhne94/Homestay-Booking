'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Sparkles, Check, ChevronRight } from 'lucide-react';
import { getRoomsAvailabilityAction } from '@/app/actions/booking';

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  thumbnail_url: string;
}

interface RoomType {
  id: string;
  name: string;
  max_guests: number;
  base_price: number;
  description: string;
  thumbnail_url: string;
  images: string[];
  amenities: { name: string; icon: string }[];
}

export default function HomeClient({
  branches,
  initialRoomTypes,
}: {
  branches: Branch[];
  initialRoomTypes: any[];
}) {
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [shouldRenderLoader, setShouldRenderLoader] = useState(true);

  // Lấy ngày hiện tại và ngày mai làm mặc định cho ô input date
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setCheckIn(todayStr);
    setCheckOut(tomorrowStr);
  }, []);

  // Tự động tắt loading sau 1.5 giây để tạo hiệu ứng ấn tượng
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    const removeTimer = setTimeout(() => {
      setShouldRenderLoader(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Tự động fetch lại phòng trống khi đổi chi nhánh
  useEffect(() => {
    if (selectedBranchId) {
      handleSearch(true);
    }
  }, [selectedBranchId]);

  const handleSearch = async (isSilent = false) => {
    if (!selectedBranchId || !checkIn || !checkOut) return;

    if (!isSilent) setIsLoading(true);
    setSearchError('');

    try {
      const res = await getRoomsAvailabilityAction(selectedBranchId, checkIn, checkOut);
      if (res.success && res.data) {
        setRoomTypes(res.data);
        if (!isSilent) {
          // Cuộn mượt xuống section danh sách phòng
          const section = document.getElementById('rooms');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else {
        setSearchError(res.error || 'Có lỗi xảy ra khi tìm kiếm.');
      }
    } catch (err: any) {
      setSearchError('Lỗi kết nối server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = (roomTypeId: string) => {
    router.push(`/checkout?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <div className="w-full">
      {/* 1. Hero Section cao cấp */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Hình nền sang trọng mờ dần */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ 
            backgroundImage: `url('${activeBranch?.thumbnail_url || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600'}')` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#1E463C]/60 via-[#1E463C]/40 to-[#FAF9F6]" />
        </div>

        {/* Nội dung slogan */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-[#FAF9F6] flex flex-col items-center gap-6 mt-[-40px]">
          <span className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-[#C5A880] uppercase bg-[#FAF9F6]/10 px-4 py-2 rounded-full backdrop-blur-sm border border-[#FAF9F6]/20">
            <Sparkles className="w-4 h-4" /> Bản hòa ca của thiên nhiên & sự sang trọng
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-tight max-w-4xl drop-shadow-md">
            Tìm Lại Sự Bình Yên <br />
            <span className="text-[#C5A880] italic font-light">Giữa Không Gian Độc Bản</span>
          </h1>
          <p className="max-w-2xl text-sm sm:text-base font-light text-[#FAF9F6]/90 leading-relaxed">
            Hệ thống biệt thự sinh thái biệt lập cao cấp tại các danh thắng đẹp nhất Việt Nam. Trải nghiệm phong cách sống mộc mạc đẳng cấp 5 sao ngay hôm nay.
          </p>

          {/* Thanh tra cứu ngày đặt phòng kính mờ (Glassmorphism Search Panel) */}
          <div className="w-full max-w-4xl mt-10 backdrop-blur-xl bg-[#FAF9F6]/85 border border-white/30 rounded-3xl p-6 shadow-2xl text-[#1E463C] flex flex-col md:flex-row items-center gap-6">
            {/* Chi nhánh */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E463C]/65 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Chi Nhánh Homestay
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#1E463C]/20 py-2 focus:ring-0 focus:border-[#C5A880] font-medium text-sm text-[#1E463C] cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="text-[#1E463C] bg-[#FAF9F6]">
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E463C]/65 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Đến
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border-0 border-b border-[#1E463C]/20 py-2 focus:ring-0 focus:border-[#C5A880] font-medium text-sm text-[#1E463C] focus:outline-none cursor-pointer"
              />
            </div>

            {/* Check-out */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E463C]/65 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Đi
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border-0 border-b border-[#1E463C]/20 py-2 focus:ring-0 focus:border-[#C5A880] font-medium text-sm text-[#1E463C] focus:outline-none cursor-pointer"
              />
            </div>

            {/* Số khách */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E463C]/65 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Số Khách
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent border-0 border-b border-[#1E463C]/20 py-2 focus:ring-0 focus:border-[#C5A880] font-medium text-sm text-[#1E463C] cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num} className="text-[#1E463C] bg-[#FAF9F6]">
                    {num} khách
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Tìm kiếm */}
            <button
              onClick={() => handleSearch(false)}
              disabled={isLoading}
              className="w-full md:w-auto px-8 h-14 rounded-2xl bg-[#1E463C] hover:bg-[#2e594e] text-[#FAF9F6] font-bold text-xs uppercase tracking-widest transition-all hover:shadow-lg focus:outline-none disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Đang quét...' : 'Kiểm tra lịch'}
            </button>
          </div>

          {searchError && (
            <p className="text-red-400 text-xs mt-2 font-medium bg-black/40 px-4 py-2 rounded-full border border-red-400/30">
              ⚠️ {searchError}
            </p>
          )}
        </div>
      </section>

      {/* 2. Chi nhánh Switcher & Info */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-[#C5A880] uppercase tracking-widest">Điểm đến cao cấp</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            Khám Phá Các <br />
            <span className="text-[#C5A880] italic">Thiên Đường Nghỉ Dưỡng</span>
          </h2>
          <p className="text-sm text-[#1E463C]/80 leading-relaxed font-light">
            Chọn chi nhánh yêu thích của bạn. Mỗi địa điểm của Galophy Retreats đều được thiết kế nương tựa vào tự nhiên nhằm đem lại năng lượng chữa lành tốt nhất.
          </p>

          <div className="flex flex-col gap-2 mt-4">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedBranchId === b.id
                    ? 'border-[#1E463C] bg-[#1E463C] text-[#FAF9F6] shadow-md shadow-[#1E463C]/10 scale-102'
                    : 'border-[#1E463C]/10 bg-white text-[#1E463C] hover:border-[#1E463C]/35'
                }`}
              >
                <div>
                  <h4 className="font-serif font-bold text-sm">{b.name}</h4>
                  <p className={`text-xs mt-0.5 font-light ${selectedBranchId === b.id ? 'text-[#FAF9F6]/80' : 'text-[#1E463C]/60'}`}>
                    {b.city}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedBranchId === b.id ? 'text-[#C5A880]' : 'text-[#1E463C]/40'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail chi nhánh được kích hoạt */}
        <div className="lg:col-span-2 relative h-[380px] rounded-3xl overflow-hidden shadow-xl">
          <img 
            src={activeBranch?.thumbnail_url} 
            alt={activeBranch?.name} 
            className="w-full h-full object-cover transition-transform duration-[1500ms] hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-[#FAF9F6] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C5A880]">Chi nhánh nổi bật</span>
            <h3 className="font-serif text-2xl font-bold">{activeBranch?.name}</h3>
            <p className="text-xs text-[#FAF9F6]/80 font-light flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> {activeBranch?.address}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Rooms Showcase Section (Masonry/Elegant grid) */}
      <section id="rooms" className="bg-[#1E463C]/5 py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <span className="text-xs font-bold text-[#C5A880] uppercase tracking-widest">Tuyển chọn nghỉ dưỡng</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1E463C]">
              Danh Sách Phòng <span className="italic text-[#C5A880] font-light">&amp; Biệt Thự</span>
            </h2>
            <p className="max-w-xl text-sm font-light text-[#1E463C]/80 mt-2">
              Xem lịch trống thời gian thực &amp; chi tiết mức giá. Mỗi căn phòng đều là một kiệt tác kiến trúc mộc mạc đẳng cấp.
            </p>
          </div>

          {/* Grid hiển thị danh sách phòng */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.map((rt) => {
              const isAvailable = rt.availableRoomsCount > 0;
              const hasPricing = !!rt.pricing;
              const finalPrice = hasPricing ? rt.pricing.finalTotalPrice : rt.base_price;
              const discount = hasPricing ? rt.pricing.discountApplied : 0;

              return (
                <div 
                  key={rt.id} 
                  className="bg-white rounded-3xl overflow-hidden border border-[#1E463C]/5 shadow-lg shadow-[#1E463C]/3 hover:shadow-2xl hover:shadow-[#1E463C]/10 transition-all duration-500 flex flex-col group"
                >
                  {/* Thumbnail Room */}
                  <Link href={`/rooms/${rt.id}`} className="relative h-[250px] overflow-hidden block cursor-pointer">
                    <img 
                      src={rt.thumbnail_url || (rt.images && rt.images[0]) || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800'} 
                      alt={rt.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Badge Trạng thái trống */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        isAvailable 
                          ? 'bg-[#FAF9F6] text-[#1E463C] border border-[#1E463C]/15 shadow-sm' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {isAvailable ? `Còn trống ${rt.availableRoomsCount} căn` : 'Hết phòng trống'}
                      </span>

                      {discount > 0 && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#C5A880] text-[#FAF9F6]">
                          Đang giảm giá!
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Tên & Số khách */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <Link href={`/rooms/${rt.id}`} className="cursor-pointer hover:underline group-hover:text-[#C5A880] transition-colors">
                          <h3 className="font-serif font-bold text-xl text-[#1E463C]">
                            {rt.name}
                          </h3>
                        </Link>
                        <span className="text-xs text-[#1E463C]/70 bg-[#1E463C]/5 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium whitespace-nowrap">
                          <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Max {rt.max_guests} khách
                        </span>
                      </div>

                      {/* Mô tả rút gọn */}
                      <p className="text-xs text-[#1E463C]/75 font-light leading-relaxed mb-6 line-clamp-3 font-sans">
                        {rt.description}
                      </p>

                      {/* Tiện ích đặc trưng */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {rt.amenities && rt.amenities.slice(0, 4).map((a: any, index: number) => (
                          <span 
                            key={index}
                            className="text-[10px] font-medium px-2 py-1 rounded-md bg-[#FAF9F6] border border-[#1E463C]/10 text-[#1E463C]/80 font-sans"
                          >
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Price & Button */}
                    <div className="border-t border-[#1E463C]/10 pt-4 flex items-center justify-between mt-auto font-sans">
                      <div>
                        {discount > 0 && (
                          <p className="text-xs text-red-500 line-through font-light -mb-0.5">
                            {Number(rt.base_price).toLocaleString()} VND
                          </p>
                        )}
                        <p className="text-lg font-bold text-[#1E463C]">
                          {Number(finalPrice).toLocaleString()}{' '}
                          <span className="text-xs font-normal text-[#1E463C]/60">VND/đêm</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleBookNow(rt.id)}
                        disabled={!isAvailable}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                          isAvailable
                            ? 'bg-[#C5A880] text-[#FAF9F6] hover:bg-[#1E463C] hover:shadow-md cursor-pointer'
                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Đặt Ngay' : 'Đóng Lịch'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Brand Values / About Section */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-6 text-[#1E463C]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600" 
                alt="Living room" 
                className="rounded-3xl h-[260px] w-full object-cover mt-8 shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600" 
                alt="Bed room" 
                className="rounded-3xl h-[260px] w-full object-cover shadow-lg"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#C5A880]/15 rounded-full blur-xl -z-10" />
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold text-[#C5A880] uppercase tracking-widest">Triết lý sống xanh</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Tinh Hoa Nghỉ Dưỡng <br />
              <span className="text-[#C5A880] italic">Chữa Lành Độc Bản</span>
            </h2>
            <p className="text-sm font-light leading-relaxed text-[#1E463C]/80 font-sans">
              Tại Galophy Retreats, chúng tôi không chỉ cung cấp một nơi lưu trú, mà còn kiến tạo một không gian để bạn kết nối sâu sắc lại với chính bản thân mình và thiên nhiên tươi đẹp.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {[
                { title: 'Kiến trúc bảo tồn sinh thái', desc: 'Mọi căn cabin đều được thiết kế từ gỗ tái chế, nương tựa vào cây rừng mà không chặt hạ.' },
                { title: 'Trải nghiệm ẩm thực hữu cơ', desc: 'Nguyên liệu thu hoạch trực tiếp tại vườn thảo mộc homestay, sạch tuyệt đối.' },
                { title: 'Tự do và bảo mật cao', desc: 'Khoảng cách giữa các bungalow tối thiểu 30m, đảm bảo sự riêng tư tuyệt hảo cho gia đình.' }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="p-1.5 rounded-full bg-[#C5A880]/10 text-[#C5A880] mt-0.5 border border-[#C5A880]/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1E463C]">{item.title}</h4>
                    <p className="text-xs text-[#1E463C]/70 font-light mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
