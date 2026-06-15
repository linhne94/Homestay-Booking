'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, Sparkles, Shield, Star, MapPin, ChevronLeft, ChevronRight, ArrowRight, Check } from 'lucide-react';

interface RoomType {
  id: string;
  name: string;
  max_guests: number;
  base_price: number;
  description: string;
  thumbnail_url: string;
  branch: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
  amenities: {
    amenity: {
      name: string;
      icon: string;
      category: string;
    };
  }[];
  room_images: {
    image_url: string;
  }[];
  reviews: {
    id: string;
    rating_overall: number;
    rating_cleanliness: number;
    rating_service: number;
    rating_location: number;
    comment: string;
    created_at: string;
    user: {
      full_name: string;
      avatar_url: string;
    };
  }[];
}

export default function RoomDetailClient({ roomType }: { roomType: RoomType }) {
  const router = useRouter();
  
  const allImages = [
    roomType.thumbnail_url,
    ...roomType.room_images.map((img) => img.image_url),
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentImageIndex, allImages.length]);

  const handleBookNow = () => {
    router.push(`/checkout?roomTypeId=${roomType.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  // Tính trung bình đánh giá
  const reviewsCount = roomType.reviews.length;
  const avgRating = reviewsCount > 0
    ? (roomType.reviews.reduce((acc, r) => acc + r.rating_overall, 0) / reviewsCount).toFixed(1)
    : '5.0';

  const avgCleanliness = reviewsCount > 0
    ? (roomType.reviews.reduce((acc, r) => acc + r.rating_cleanliness, 0) / reviewsCount).toFixed(1)
    : '5.0';

  const avgService = reviewsCount > 0
    ? (roomType.reviews.reduce((acc, r) => acc + r.rating_service, 0) / reviewsCount).toFixed(1)
    : '5.0';

  const avgLocation = reviewsCount > 0
    ? (roomType.reviews.reduce((acc, r) => acc + r.rating_location, 0) / reviewsCount).toFixed(1)
    : '5.0';

  // Gom nhóm tiện ích theo category
  const groupedAmenities = roomType.amenities.reduce((acc: any, item) => {
    const cat = item.amenity.category || 'Tiện ích khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item.amenity.name);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-wood-dark">
      {/* Nút quay lại */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition-colors mb-8 group cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>

      {/* Grid chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cột Trái: Ảnh Gallery & Chi tiết phòng (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Gallery hình ảnh */}
          <div className="flex flex-col gap-4">
            <div className="h-[450px] w-full rounded-2xl overflow-hidden relative group/gallery shadow-md bg-bg-section">
              <img 
                src={allImages[currentImageIndex]} 
                alt={roomType.name} 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              />
              
              {/* Nút chuyển ảnh thủ công dạng glassmorphism */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-primary flex items-center justify-center cursor-pointer hover:bg-white/50 hover:scale-105 transition-all opacity-0 group-hover/gallery:opacity-100 duration-300 shadow-md"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-primary flex items-center justify-center cursor-pointer hover:bg-white/50 hover:scale-105 transition-all opacity-0 group-hover/gallery:opacity-100 duration-300 shadow-md"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Chỉ số ảnh hiện tại */}
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] text-white font-semibold tracking-wider">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>
            {/* Ảnh nhỏ thumbnail */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    currentImageIndex === i ? 'border-primary scale-102 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`room image ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề & Sơ lược */}
          <div className="flex flex-col gap-3 border-b border-wood-light/30 pb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-bg-section text-primary-light px-3 py-1 rounded-full text-xs font-medium">
                {roomType.branch.city}
              </span>
              <span className="text-xs text-primary-light flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> {roomType.branch.name}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-wood-dark leading-tight">{roomType.name}</h1>
            <div className="flex items-center gap-6 text-sm text-wood-dark/85 mt-2">
              <span className="bg-highlight text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Tối đa {roomType.max_guests} khách
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-wood-dark">
                <Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} ({reviewsCount} đánh giá)
              </span>
            </div>
          </div>

          {/* Mô tả dài */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl font-semibold text-wood-dark pl-3" style={{ borderLeft: '3px solid #7A9E7E' }}>Về không gian này</h3>
            <p className="text-sm font-normal leading-relaxed text-wood-dark/80 whitespace-pre-line">
              {roomType.description}
            </p>
          </div>

          {/* Tiện ích phân nhóm */}
          <div className="flex flex-col gap-6 border-t border-wood-light/30 pt-8">
            <h3 className="font-serif text-xl font-semibold text-wood-dark">Tiện nghi có sẵn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(groupedAmenities).map((cat, i) => (
                <div key={i} className="flex flex-col gap-3 bg-white p-6 rounded-2xl border border-wood-light/35 shadow-sm">
                  <h4 className="font-serif font-medium text-sm text-wood-dark border-b border-wood-light/30 pb-2">
                    {cat}
                  </h4>
                  <ul className="flex flex-wrap gap-2 text-xs text-wood-dark/85 font-light pt-2">
                    {groupedAmenities[cat].map((name: string, index: number) => (
                      <li key={index} className="bg-bg-section text-wood-dark rounded-full text-sm px-3 py-1 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary-light shrink-0" />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Đánh giá bình luận */}
          <div className="flex flex-col gap-8 border-t border-wood-light/30 pt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-wood-dark">Khách nói gì về Mơ</h3>
              <div className="flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg text-sm font-bold text-primary">
                <Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} / 5.0
              </div>
            </div>

            {/* Chi tiết điểm thành phần */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-wood-light/35 shadow-sm">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-xs text-primary-light font-medium">Sạch sẽ</span>
                <span className="text-xl font-bold text-primary">{avgCleanliness} / 5</span>
              </div>
              <div className="flex flex-col gap-1 text-center sm:border-x sm:border-wood-light/30">
                <span className="text-xs text-primary-light font-medium">Phục vụ</span>
                <span className="text-xl font-bold text-primary">{avgService} / 5</span>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-xs text-primary-light font-medium">Vị trí</span>
                <span className="text-xl font-bold text-primary">{avgLocation} / 5</span>
              </div>
            </div>

            {/* List comment */}
            <div className="flex flex-col gap-6">
              {roomType.reviews.length > 0 ? (
                roomType.reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-wood-light/25 pb-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rev.user.avatar_url ? (
                          <img src={rev.user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-wood-light/30" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-wood-light/35">
                            <Star className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <h5 className="font-serif font-bold text-sm text-wood-dark">{rev.user.full_name}</h5>
                          <span className="text-[10px] text-wood-dark/50">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating_overall }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-wood-dark/80 font-light leading-relaxed pl-[52px]">
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-primary-light italic text-center py-6">Khách chưa có đánh giá nào cho loại phòng này. Hãy là người đầu tiên trải nghiệm!</p>
              )}
            </div>
          </div>
        </div>

        {/* Cột Phải: Form Đặt phòng nhanh (4 columns) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit">
          <div className="bg-white border border-wood-light rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div>
              <span className="bg-bg-section text-primary-light px-2.5 py-1 rounded-full text-xs font-semibold w-fit">Giá tốt nhất trực tiếp</span>
              <p className="text-3xl font-serif font-black text-primary mt-3 flex items-baseline gap-1">
                {Number(roomType.base_price).toLocaleString()}{' '}
                <span className="text-sm font-sans font-light text-wood-dark/70">VND/đêm</span>
              </p>
            </div>

            <div className="flex flex-col gap-4 border-y border-wood-light/30 py-6">
              {/* Check-in */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-light" /> Ngày đến
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-bg-main border border-wood-light rounded-xl px-3 py-2.5 font-medium text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                />
              </div>

              {/* Check-out */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-light" /> Ngày đi
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full bg-bg-main border border-wood-light rounded-xl px-3 py-2.5 font-medium text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                />
              </div>

              {/* Số khách */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-wood-dark flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary-light" /> Số khách
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-bg-main border border-wood-light rounded-xl px-3 py-2.5 font-medium text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                >
                  {Array.from({ length: roomType.max_guests }).map((_, idx) => (
                    <option key={idx} value={idx + 1}>
                      {idx + 1} khách
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-medium text-sm transition-all hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
            >
              Tiến hành đặt phòng <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-primary-light font-medium">
              <Shield className="w-3.5 h-3.5 text-primary-light" /> Bảo mật thông tin tuyệt đối
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
