'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export interface UploadedImage {
  id?: string;
  url: string; // Preview URL or remote URL
  file?: File; // Present if it's a new local file to upload
}

interface ImageUploadZoneProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  label?: string;
}

export default function ImageUploadZone({
  images,
  onChange,
  maxImages = 10,
  label = "Ảnh đại diện & hình ảnh chi tiết",
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const newImages: UploadedImage[] = [];
    const currentCount = images.length;
    
    // Limit to maxImages
    const remainingCount = maxImages - currentCount;
    if (remainingCount <= 0) return;

    Array.from(fileList).slice(0, remainingCount).forEach(file => {
      // Validate is image
      if (!file.type.startsWith('image/')) return;
      
      newImages.push({
        url: URL.createObjectURL(file),
        file,
      });
    });

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const targetImage = images[index];
    // Revoke object URL to avoid memory leak if it was a local file
    if (targetImage.file) {
      URL.revokeObjectURL(targetImage.url);
    }
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[9px] font-bold uppercase tracking-wider text-[#FAF9F6]/75">
        {label} {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>
      
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all min-h-36 ${
          isDragActive 
            ? 'border-[#C5A880] bg-[#C5A880]/5' 
            : 'border-[#232731] hover:border-[#C5A880]/50 bg-[#0B0C10]/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        
        <div className="p-3 bg-[#161920] rounded-full border border-[#232731] text-[#C5A880]">
          <Upload className="w-5 h-5" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-[#FAF9F6]">Kéo thả ảnh hoặc click để tải lên</p>
          <p className="text-[10px] text-[#FAF9F6]/40 mt-1">Hỗ trợ PNG, JPG, JPEG (Tối đa {maxImages} ảnh)</p>
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-1.5 p-3 rounded-2xl bg-[#0B0C10]/20 border border-[#232731]/40">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="relative aspect-square rounded-xl overflow-hidden border border-[#232731] group bg-[#161920]"
            >
              <img 
                src={img.url} 
                alt={`preview-${idx}`} 
                className="w-full h-full object-cover"
              />
              
              {/* Badge for Thumbnail */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-[#C5A880] text-[#0B0C10] text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                  Ảnh chính
                </div>
              )}

              {/* Local File indicator */}
              {img.file && (
                <div className="absolute bottom-1.5 left-1.5 bg-[#161920]/85 text-[#FAF9F6] text-[8px] font-medium px-1.5 py-0.5 rounded border border-[#232731]">
                  Mới
                </div>
              )}

              {/* Delete overlay button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-950/80 border border-red-900/50 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-900 cursor-pointer shadow"
                title="Xóa ảnh"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
