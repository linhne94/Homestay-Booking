import React from 'react';

export default function GuestLoading() {
  return (
    <div className="min-h-[60vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8 animate-pulse text-[#6B4C2A]">
      {/* Hero Banner Placeholder */}
      <div className="w-full h-48 sm:h-64 bg-[#EDE9E1] rounded-3xl flex flex-col justify-end p-6 sm:p-8 gap-3 border border-[#C8B99A]/30">
        <div className="h-8 w-1/3 bg-[#C8B99A]/45 rounded-lg"></div>
        <div className="h-4 w-1/2 bg-[#C8B99A]/30 rounded-md"></div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Detail or forms placeholder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#EDE9E1]/60 border border-[#C8B99A]/20 rounded-2xl p-6 flex flex-col gap-5">
            <div className="h-6 w-48 bg-[#C8B99A]/50 rounded-lg"></div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-16 bg-[#C8B99A]/40 rounded-sm"></div>
                  <div className="h-10 w-full bg-[#EDE9E1] rounded-xl border border-[#C8B99A]/15"></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-20 bg-[#C8B99A]/40 rounded-sm"></div>
                  <div className="h-10 w-full bg-[#EDE9E1] rounded-xl border border-[#C8B99A]/15"></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-[#C8B99A]/40 rounded-sm"></div>
                <div className="h-10 w-full bg-[#EDE9E1] rounded-xl border border-[#C8B99A]/15"></div>
              </div>
              <div className="h-12 w-full bg-[#3D5A40]/30 rounded-xl mt-4"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Summary Card Placeholder */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#EDE9E1] border border-[#C8B99A]/35 rounded-2xl p-6 flex flex-col gap-4">
            <div className="h-5 w-32 bg-[#C8B99A]/50 rounded-lg"></div>
            <div className="w-full aspect-[4/3] bg-[#C8B99A]/20 rounded-xl"></div>
            <div className="flex flex-col gap-2.5 mt-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[#C8B99A]/35 rounded-md"></div>
                <div className="h-4 w-16 bg-[#C8B99A]/35 rounded-md"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-[#C8B99A]/30 rounded-md"></div>
                <div className="h-4 w-12 bg-[#C8B99A]/30 rounded-md"></div>
              </div>
              <div className="h-px bg-[#C8B99A]/20 my-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-5 w-16 bg-[#C8B99A]/50 rounded-md"></div>
                <div className="h-6 w-24 bg-[#C8B99A]/60 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
