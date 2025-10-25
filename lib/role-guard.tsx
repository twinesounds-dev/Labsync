'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        router.push('/auth/login');
      } else if (!allowedRoles.includes(userProfile.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboardRoute = getRoleDashboard(userProfile.role);
        router.push(dashboardRoute);
      }
    }
  }, [userProfile, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'owner':
      return '/dashboard/owner';
    case 'receptionist':
      return '/dashboard/reception';
    case 'clerk':
      return '/dashboard/clerk';
    case 'lab_tech':
      return '/dashboard/lab-tech';
    default:
      return '/auth/login';
  }
}
