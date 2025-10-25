'use client';

import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export default function RoleGuard({ allowedRoles, children, fallbackPath = '/auth/login' }: RoleGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to appropriate dashboard based on user role
        const roleDashboards = {
          owner: '/dashboard/owner',
          receptionist: '/dashboard/reception',
          clerk: '/dashboard/clerk',
          lab_tech: '/dashboard/lab-tech',
        };
        
        router.push(roleDashboards[userProfile.role] || fallbackPath);
        return;
      }
    }
  }, [user, userProfile, loading, allowedRoles, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (userProfile && !allowedRoles.includes(userProfile.role))) {
    return null;
  }

  return <>{children}</>;
}