import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BranchesClient from '@/components/dashboard/BranchesClient';

export default async function AdminBranchesPage() {
  const staff = await getSessionStaff();
  
  // Phân quyền: Chỉ cho phép ADMIN truy cập trang chi nhánh
  if (!staff || staff.staff_profile.role !== 'ADMIN') {
    redirect('/admin');
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { room_types: true, staffs: true }
      }
    }
  });

  // Convert Decimal/Float types correctly for client hydration if needed
  const formattedBranches = branches.map(b => ({
    ...b,
    latitude: Number(b.latitude),
    longitude: Number(b.longitude),
  }));

  return (
    <BranchesClient 
      initialBranches={formattedBranches} 
      currentStaffBranchId={staff.staff_profile.branch_id} 
    />
  );
}
