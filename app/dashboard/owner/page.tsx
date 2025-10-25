'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import {
  Building2,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function OwnerDashboard() {
  const [stats] = useState({
    totalRevenue: 145000000,
    monthlyRevenue: 12500000,
    totalPatients: 1245,
    monthlyPatients: 156,
    pendingApprovals: 12,
    activeStaff: 18,
  });

  const facilities = [
    {
      name: 'FIRSTLINE - NTUNGAMO',
      patients: 452,
      revenue: 48000000,
      pending: 5,
    },
    {
      name: 'FIRSTLINE - MBARARA',
      patients: 523,
      revenue: 62000000,
      pending: 4,
    },
    {
      name: 'PRIMECURE MEDICAL',
      patients: 270,
      revenue: 35000000,
      pending: 3,
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Owner Dashboard - Multi-Facility Overview
        </h1>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-blue-600 mt-1">UGX</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Total Patients
                </p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {stats.totalPatients.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.monthlyPatients} this month
                </p>
              </div>
              <Users className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Pending Approvals
                </p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {stats.pendingApprovals}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Across all facilities
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Facility Overview */}
        <Card title="Facility Performance" className="mb-8">
          <div className="space-y-4">
            {facilities.map((facility) => (
              <div
                key={facility.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-primary mr-3" />
                    <h3 className="font-semibold text-lg">{facility.name}</h3>
                  </div>
                  {facility.pending > 0 && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {facility.pending} Pending
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-xl font-bold text-gray-900">
                      {facility.patients}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      {(facility.revenue / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Growth</p>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <p className="text-xl font-bold text-green-600">
                        +12%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Approve Results</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.pendingApprovals} pending
              </p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Financial Reports</h3>
              <p className="text-sm text-gray-600 mt-1">View detailed reports</p>
            </div>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => window.location.href = '/dashboard/owner/users'}
          >
            <div className="text-center py-4">
              <Users className="w-10 h-10 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.activeStaff} active staff
              </p>
            </div>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => window.location.href = '/dashboard/owner/facilities'}
          >
            <div className="text-center py-4">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Facilities</h3>
              <p className="text-sm text-gray-600 mt-1">3 locations</p>
            </div>
          </Card>
        </div>

        {/* Additional Management Options */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = '/dashboard/owner/tests'}
            >
              <div className="text-center py-4">
                <div className="w-10 h-10 mx-auto mb-2 text-teal-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <h3 className="font-semibold">Manage Tests</h3>
                <p className="text-sm text-gray-600 mt-1">Add & import lab tests</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
