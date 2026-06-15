'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { switchBranchAction } from '@/app/actions/branch';
import { Loader2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface BranchSwitcherProps {
  branches: Branch[];
  currentBranchId: string;
  currentBranchName: string;
  isAdmin: boolean;
}

export default function BranchSwitcher({
  branches,
  currentBranchId,
  currentBranchName,
  isAdmin,
}: BranchSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(currentBranchId);

  if (!isAdmin) {
    return (
      <span className="text-xs font-bold text-[#C5A880] bg-[#C5A880]/10 px-2.5 py-1 rounded border border-[#C5A880]/20">
        {currentBranchName}
      </span>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextBranchId = e.target.value;
    setSelectedId(nextBranchId);
    
    startTransition(async () => {
      const res = await switchBranchAction(nextBranchId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Không thể đổi chi nhánh.');
        setSelectedId(currentBranchId);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 relative">
      <select
        value={selectedId}
        onChange={handleChange}
        disabled={isPending}
        className="text-xs font-bold text-[#C5A880] bg-[#161920] px-3 py-1.5 rounded border border-[#C5A880]/30 focus:outline-none focus:border-[#C5A880] cursor-pointer hover:bg-[#232731] transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-8 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23C5A880%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_10px_center] bg-no-repeat"
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id} className="bg-[#161920] text-[#FAF9F6]">
            {b.name}
          </option>
        ))}
      </select>
      {isPending && (
        <Loader2 className="w-3.5 h-3.5 text-[#C5A880] animate-spin shrink-0" />
      )}
    </div>
  );
}
