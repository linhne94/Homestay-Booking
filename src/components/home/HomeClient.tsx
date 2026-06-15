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
      {/* 1. Hero Section Lơ Mơ */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Hình nền mờ dần */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ 
            backgroundImage: `url('${activeBranch?.thumbnail_url || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600'}')` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/40 to-bg-main" />
        </div>

        {/* Nội dung Slogan */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white flex flex-col items-center gap-6 mt-[-40px]">
          <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-wood-light bg-dark/45 px-4 py-2 rounded-full backdrop-blur-sm border border-wood-light/35">
            <Sparkles className="w-4 h-4 text-primary-light" /> Một nơi để thực sự nghỉ ngơi
          </span>
          <h1 className="font-serif leading-tight max-w-4xl drop-shadow-md text-balance" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 600 }}>
            Một chốn lơ mơ<br />giữa lòng Đà Lạt
          </h1>
          <p className="max-w-2xl text-base font-normal text-white/85 leading-relaxed text-pretty">
            Nhà nguyên căn · Không gian riêng tư · Gần trung tâm
          </p>

          {/* Thanh tra cứu ngày đặt phòng (Glassmorphism Search Panel) */}
          <div className="w-full max-w-4xl mt-10 backdrop-blur-xl bg-white border border-wood-light rounded-[16px] p-6 shadow-2xl text-wood-dark flex flex-col md:flex-row items-center gap-6">
            {/* Chi nhánh */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-light" /> Chi nhánh Homestay
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-wood-light py-2 focus:ring-0 focus:border-primary font-medium text-sm text-wood-dark cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="text-wood-dark bg-bg-main">
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-light" /> Ngày đến
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border-0 border-b border-wood-light py-2 focus:ring-0 focus:border-primary font-medium text-sm text-wood-dark focus:outline-none cursor-pointer"
              />
            </div>

            {/* Check-out */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-light" /> Ngày đi
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border-0 border-b border-wood-light py-2 focus:ring-0 focus:border-primary font-medium text-sm text-wood-dark focus:outline-none cursor-pointer"
              />
            </div>

            {/* Số khách */}
            <div className="flex-1 w-full text-left flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary-light" /> Số khách
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent border-0 border-b border-wood-light py-2 focus:ring-0 focus:border-primary font-medium text-sm text-wood-dark cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num} className="text-wood-dark bg-bg-main">
                    {num} khách
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Tìm kiếm */}
            <button
              onClick={() => handleSearch(false)}
              disabled={isLoading}
              className="w-full md:w-auto px-8 h-14 rounded-xl bg-primary hover:bg-primary-light text-white font-medium text-sm transition-all hover:shadow-lg focus:outline-none disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Đang quét...' : 'Kiểm tra lịch'}
            </button>
          </div>

          {searchError && (
            <p className="text-red-600 text-xs mt-2 font-medium bg-white/95 px-4 py-2 rounded-full border border-red-200">
              ⚠️ {searchError}
            </p>
          )}
        </div>
      </section>

      {/* Highlight Strip */}
      <section className="bg-bg-section py-10 border-b border-wood-light">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-3xl">🌲</span>
            <div>
              <h4 className="text-wood-dark font-medium text-base">Giữa lòng thành phố</h4>
              <p className="text-primary-light text-xs mt-0.5">Cách quảng trường 2 phút</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 border-y md:border-y-0 md:border-x border-wood-light/30 py-4 md:py-0 md:px-8">
            <span className="text-3xl">🏠</span>
            <div>
              <h4 className="text-wood-dark font-medium text-base">Nhà nguyên căn</h4>
              <p className="text-primary-light text-xs mt-0.5">Không gian riêng tư hoàn toàn</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-3xl">🫧</span>
            <div>
              <h4 className="text-wood-dark font-medium text-base">Ấm cúng như ở nhà</h4>
              <p className="text-primary-light text-xs mt-0.5">Bếp đầy đủ, sân riêng</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Chi nhánh Switcher & Info */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-semibold text-primary-light tracking-wide">Điểm đến yên bình</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-wood-dark">
            Khám phá các <br />
            <span className="text-primary-light italic font-normal">không gian của Mơ</span>
          </h2>
          <p className="text-sm text-wood-dark/80 leading-relaxed font-light font-sans">
            Chọn chi nhánh yêu thích của bạn. Mỗi địa điểm của Lơ Mơ Homestay đều được thiết kế mộc mạc, nương tựa vào tự nhiên nhằm đem lại năng lượng bình yên nhất.
          </p>

          <div className="flex flex-col gap-2 mt-4 font-sans">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedBranchId === b.id
                    ? 'border-wood-light bg-primary text-white shadow-md'
                    : 'border-wood-light/35 bg-white text-wood-dark hover:border-primary-light'
                }`}
              >
                <div>
                  <h4 className="font-serif font-bold text-sm">{b.name}</h4>
                  <p className={`text-xs mt-0.5 font-light ${selectedBranchId === b.id ? 'text-white/80' : 'text-wood-dark/60'}`}>
                    {b.city}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedBranchId === b.id ? 'text-wood-light' : 'text-wood-dark/40'}`} />
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
          <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-white flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-wood-light/95">Chi nhánh nổi bật</span>
            <h3 className="font-serif text-2xl font-semibold">{activeBranch?.name}</h3>
            <p className="text-xs text-white/85 font-light flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-wood-light" /> {activeBranch?.address}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Rooms Showcase Section */}
      <section id="rooms" className="bg-bg-section/40 py-24 scroll-mt-20 border-t border-wood-light/35">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <span className="text-xs font-semibold text-primary-light tracking-wide">Không gian yên bình</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-wood-dark">
              Các không gian của Mơ
            </h2>
            <p className="max-w-xl text-sm font-light text-primary-light mt-2">
              Mỗi căn là một trải nghiệm khác nhau. Xem lịch trống thời gian thực và chi tiết mức giá.
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
                  className="bg-white rounded-2xl overflow-hidden border border-wood-light shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
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
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
                        isAvailable 
                          ? 'bg-white text-primary border border-wood-light/40 shadow-sm' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {isAvailable ? `Còn trống ${rt.availableRoomsCount} căn` : 'Hết phòng trống'}
                      </span>

                      {discount > 0 && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-primary text-white">
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
                        <Link href={`/rooms/${rt.id}`} className="cursor-pointer hover:underline group-hover:text-primary-light transition-colors">
                          <h3 className="font-serif font-bold text-xl text-wood-dark">
                            {rt.name}
                          </h3>
                        </Link>
                        <span className="text-xs text-wood-dark/70 bg-bg-section px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium whitespace-nowrap">
                          <Users className="w-3.5 h-3.5 text-primary-light" /> Max {rt.max_guests} khách
                        </span>
                      </div>

                      {/* Mô tả rút gọn */}
                      <p className="text-xs text-wood-dark/85 font-light leading-relaxed mb-6 line-clamp-3 font-sans">
                        {rt.description}
                      </p>

                      {/* Tiện ích đặc trưng */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {rt.amenities && rt.amenities.slice(0, 4).map((a: any, index: number) => (
                          <span 
                            key={index}
                            className="text-[10px] font-medium px-2 py-1 rounded-md bg-bg-section border border-wood-light/45 text-wood-dark/90 font-sans"
                          >
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Price & Button */}
                    <div className="border-t border-wood-light/25 pt-4 flex items-center justify-between mt-auto font-sans">
                      <div>
                        {discount > 0 && (
                          <p className="text-xs text-red-600 line-through font-light -mb-0.5">
                            {Number(rt.base_price).toLocaleString()} VND
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary">
                          {Number(finalPrice).toLocaleString()}{' '}
                          <span className="text-xs font-normal text-wood-dark/70">VND/đêm</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleBookNow(rt.id)}
                        disabled={!isAvailable}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isAvailable
                            ? 'bg-primary text-white hover:bg-primary-light hover:shadow-md cursor-pointer'
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
      <section id="about" className="py-24 bg-primary text-white w-full border-t border-wood-light/25">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl -z-10" />
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold text-wood-light/90">Triết lý sống chậm</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
              Lơ Mơ là gì?
            </h2>
            <p className="text-sm font-light leading-relaxed text-white/80 font-sans">
              Tại Lơ Mơ, chúng tôi không chỉ cung cấp một nơi lưu trú, mà còn cùng bạn dệt nên những khoảnh khắc sống chậm giữa rừng thông rì rào, tiếng chim hót buổi sớm và hơi ấm của một tách trà nóng.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {[
                { title: 'Gần gũi và mộc mạc', desc: 'Mọi góc nhỏ đều sử dụng chất liệu gỗ thông tự nhiên ấm áp, nương tựa vào rừng mà không làm tổn hại thiên nhiên.' },
                { title: 'Trải nghiệm bình yên', desc: 'Dành cho những tâm hồn muốn trốn chạy phố thị ồn ào để tìm lại sự thảnh thơi trong tâm trí.' },
                { title: 'Tự do như ở nhà', desc: 'Không gian bếp đầy đủ gia vị, sân nướng BBQ riêng để bạn tự do sum vầy bên người thương.' }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="p-1.5 rounded-full bg-white/10 text-wood-light mt-0.5 border border-white/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-white/70 font-light mt-0.5">{item.desc}</p>
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
