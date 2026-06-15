import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse w-full">
      {/* Page Header Placeholder */}
      <div className="flex justify-between items-center pb-4 border-b border-[#232731]">
        <div className="flex flex-col gap-2 w-full">
          <div className="h-7 w-48 bg-[#232731] rounded-lg"></div>
          <div className="h-4 w-96 bg-[#232731]/60 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-[#232731] rounded-xl shrink-0"></div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-[#232731] rounded-md"></div>
              <div className="h-8 w-8 bg-[#232731] rounded-full"></div>
            </div>
            <div className="h-8 w-32 bg-[#232731] rounded-lg mt-2"></div>
            <div className="h-4 w-40 bg-[#232731]/50 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Grid of Content Cards (simulating table or main listings) */}
      <div className="bg-[#161920] border border-[#232731] rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-[#232731] rounded-md"></div>
          <div className="h-8 w-20 bg-[#232731] rounded-lg"></div>
        </div>
        
        {/* Table skeleton rows */}
        <div className="flex flex-col gap-3 mt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center gap-4 py-3 border-b border-[#232731]/40 last:border-0">
              <div className="h-10 w-10 bg-[#232731] rounded-xl shrink-0"></div>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="h-4 w-1/3 bg-[#232731] rounded-md"></div>
                <div className="h-3.5 w-1/4 bg-[#232731]/60 rounded-sm"></div>
              </div>
              <div className="h-6 w-24 bg-[#232731]/80 rounded-full shrink-0"></div>
              <div className="h-6 w-16 bg-[#232731]/50 rounded-lg shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
