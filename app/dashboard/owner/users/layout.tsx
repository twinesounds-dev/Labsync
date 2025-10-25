'use client';

import { RoleGuard } from '@/lib/role-guard';

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={['owner']}>{children}</RoleGuard>;
}
