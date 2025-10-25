'use client';

import { RoleGuard } from '@/lib/role-guard';

export default function TestManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={['owner']}>{children}</RoleGuard>;
}
