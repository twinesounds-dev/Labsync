'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (userProfile) {
        // Redirect based on user role
        switch (userProfile.role) {
          case 'receptionist':
            router.push('/dashboard/reception');
            break;
          case 'clerk':
            router.push('/dashboard/clerk');
            break;
          case 'lab_tech':
            router.push('/dashboard/lab-tech');
            break;
          case 'owner':
            router.push('/dashboard/owner');
            break;
          default:
            router.push('/dashboard');
        }
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LabSync...</p>
        </div>
      </div>
    );
  }

  return null;
}
