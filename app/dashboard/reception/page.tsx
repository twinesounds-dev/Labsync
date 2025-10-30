'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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

        {/* Patient Registration */}
        <div className="mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Patient Registration</h2>
                <p className="text-gray-600 text-sm mt-1">Register new patients for lab testing</p>
              </div>
              <Link href="/dashboard/reception/patients/new">
                <Button size="lg" className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Add New Patient
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-900">Walk-in</h3>
                </div>
                <p className="text-sm text-green-800">Register → Clerk Consultation → Payment → Sample Collection → Lab</p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Referral</h3>
                </div>
                <p className="text-sm text-blue-800">Register with Form → Select Tests → Payment → Sample Collection → Lab</p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-purple-900">Inpatient</h3>
                </div>
                <p className="text-sm text-purple-800">Verify Transfer → Payment → Sample Collection → Lab</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          <Link href="/dashboard/reception/payments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-green-600 text-white">
              <div className="text-center py-6">
                <Receipt className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Process Payment</h3>
                <p className="text-sm opacity-90 mt-1">Record patient payments</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reception/test-results">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-blue-600 text-white">
              <div className="text-center py-6">
                <TestTube className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Test Results</h3>
                <p className="text-sm opacity-90 mt-1">View and approve test results</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reception/reports/ready">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-indigo-600 text-white">
              <div className="text-center py-6">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Ready Reports</h3>
                <p className="text-sm opacity-90 mt-1">Print approved patient reports</p>
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

          <Link href="/dashboard/reception/reports/ready">
            <Card title="Reports Ready for Collection" subtitle={`${stats.patientsWaitingForReports} reports`} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="space-y-3">
                {stats.patientsWaitingForReports === 0 ? (
                  <p className="text-gray-500 text-sm">No reports ready</p>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Click to view and print</p>
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
