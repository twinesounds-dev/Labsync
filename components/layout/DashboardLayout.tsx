'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  TestTube,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Home,
  FileText,
  ClipboardList,
  FlaskConical,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = {
    receptionist: [
      { name: 'Dashboard', href: '/dashboard/reception', icon: Home },
      { name: 'Patients', href: '/dashboard/reception/patients', icon: Users },
      { name: 'Test Requests', href: '/dashboard/reception/test-requests', icon: ClipboardList },
      { name: 'Payments', href: '/dashboard/reception/payments', icon: Receipt },
      { name: 'Reports', href: '/dashboard/reception/reports', icon: FileText },
    ],
    clerk: [
      { name: 'Dashboard', href: '/dashboard/clerk', icon: Home },
      { name: 'Sample Reception', href: '/dashboard/clerk/samples', icon: TestTube },
      { name: 'Test Selection', href: '/dashboard/clerk/tests', icon: ClipboardList },
      { name: 'Request Forms', href: '/dashboard/clerk/forms', icon: FileText },
    ],
    lab_tech: [
      { name: 'Dashboard', href: '/dashboard/lab-tech', icon: Home },
      { name: 'Pending Tests', href: '/dashboard/lab-tech/pending', icon: FlaskConical },
      { name: 'Enter Results', href: '/dashboard/lab-tech/results', icon: TestTube },
      { name: 'Quality Control', href: '/dashboard/lab-tech/qc', icon: ClipboardList },
    ],
    owner: [
      { name: 'Overview', href: '/dashboard/owner', icon: Home },
      { name: 'Facilities', href: '/dashboard/owner/facilities', icon: BarChart3 },
      { name: 'Approvals', href: '/dashboard/owner/approvals', icon: ClipboardList },
      { name: 'Reports', href: '/dashboard/owner/reports', icon: FileText },
      { name: 'Users', href: '/dashboard/owner/users', icon: Users },
      { name: 'Tests', href: '/dashboard/owner/tests', icon: TestTube },
      { name: 'Settings', href: '/dashboard/owner/settings', icon: Settings },
    ],
  };

  const navItems = navigation[userProfile.role] || [];

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary">LabSync</h1>
            <p className="text-xs text-gray-600 mt-1">
              {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1).replace('_', ' ')}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">
                {userProfile.firstName} {userProfile.lastName}
              </p>
              <p className="text-xs text-gray-600">{userProfile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
