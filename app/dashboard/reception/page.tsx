'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Users, Receipt, TestTube, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRealtimeStats } from '@/lib/hooks/useRealtimeStats';

export default function ReceptionDashboard() {
  const { userProfile } = useAuth();
  const { stats, loading } = useRealtimeStats(userProfile?.facilityId || '');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Reception Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Today&apos;s Patients</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.todayPatients}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {(stats.todayRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-green-600">UGX</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Tests Today</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{stats.testsToday}</p>
              </div>
              <TestTube className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending Payments</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{stats.pendingPayments}</p>
              </div>
              <Receipt className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/reception/patients/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-primary text-white">
              <div className="text-center py-6">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Register New Patient</h3>
                <p className="text-sm opacity-90 mt-1">Add new patient to the system</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reception/payments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-secondary text-white">
              <div className="text-center py-6">
                <Receipt className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Process Payment</h3>
                <p className="text-sm opacity-90 mt-1">Record patient payments</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reception/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-indigo-600 text-white">
              <div className="text-center py-6">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Print Reports</h3>
                <p className="text-sm opacity-90 mt-1">Print patient test reports</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Patients Waiting for Sample Collection" subtitle={`${stats.patientsWaitingForSamples} patients`}>
            <div className="space-y-3">
              {stats.patientsWaitingForSamples === 0 ? (
                <p className="text-gray-500 text-sm">No patients waiting</p>
              ) : (
                <p className="text-sm text-gray-600">Click to view full queue</p>
              )}
            </div>
          </Card>

          <Card title="Reports Ready for Collection" subtitle={`${stats.patientsWaitingForReports} reports`}>
            <div className="space-y-3">
              {stats.patientsWaitingForReports === 0 ? (
                <p className="text-gray-500 text-sm">No reports ready</p>
              ) : (
                <p className="text-sm text-gray-600">Click to view and print</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
