'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import {
  Building2,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPatients: 0,
    monthlyPatients: 0,
    pendingApprovals: 0,
    activeStaff: 0,
  });

  const [facilities, setFacilities] = useState([
    {
      id: '',
      name: 'FIRSTLINE - NTUNGAMO',
      code: 'FLNT',
      patients: 0,
      revenue: 0,
      pending: 0,
    },
    {
      id: '',
      name: 'FIRSTLINE - MBARARA',
      code: 'FLMB',
      patients: 0,
      revenue: 0,
      pending: 0,
    },
    {
      id: '',
      name: 'PRIMECURE MEDICAL',
      code: 'PCMC',
      patients: 0,
      revenue: 0,
      pending: 0,
    },
  ]);

  const loadDashboardStats = async () => {
    try {
      // Get all facilities
      const facilitiesData = await firestoreService.getAll(COLLECTIONS.FACILITIES);
      
      // Get all patients
      const patients = await firestoreService.getAll(COLLECTIONS.PATIENTS);
      
      // Get all payments
      const payments = await firestoreService.getAll(COLLECTIONS.PAYMENTS);
      
      // Get all users
      const users = await firestoreService.getAll(COLLECTIONS.USERS);
      
      // Get all test results
      const testResults = await firestoreService.getAll(COLLECTIONS.TEST_RESULTS);

      // Calculate this month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate total revenue
      const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);

      // Calculate monthly revenue
      const monthlyRevenue = payments
        .filter((p: any) => {
          const paymentDate = new Date(p.paymentDate?.toDate ? p.paymentDate.toDate() : p.paymentDate);
          return paymentDate >= startOfMonth;
        })
        .reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);

      // Calculate monthly patients
      const monthlyPatients = patients.filter((p: any) => {
        const registrationDate = new Date(p.registrationDate?.toDate ? p.registrationDate.toDate() : p.registrationDate);
        return registrationDate >= startOfMonth;
      }).length;

      // Calculate pending approvals
      const pendingApprovals = testResults.filter((tr: any) => tr.status === 'Submitted').length;

      // Calculate active staff
      const activeStaff = users.filter((u: any) => u.isActive).length;

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalPatients: patients.length,
        monthlyPatients,
        pendingApprovals,
        activeStaff,
      });

      // Calculate facility-specific stats
      const facilityStats = facilitiesData.map((facility: any) => {
        const facilityPatients = patients.filter((p: any) => p.facilityId === facility.id);
        const facilityPayments = payments.filter((p: any) => {
          const patient = patients.find((pt: any) => pt.id === p.patientId);
          return patient?.facilityId === facility.id;
        });
        const facilityTestResults = testResults.filter((tr: any) => tr.facilityId === facility.id);

        return {
          id: facility.id,
          name: facility.name,
          code: facility.code,
          patients: facilityPatients.length,
          revenue: facilityPayments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0),
          pending: facilityTestResults.filter((tr: any) => tr.status === 'Submitted').length,
        };
      });

      setFacilities(facilityStats);
    } catch (error) {
      console.error('Error loading owner dashboard stats:', error);
      // Keep default values on error
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

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
                  {stats.totalRevenue === 0 ? '0' : (stats.totalRevenue / 1000000).toFixed(1) + 'M'}
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
                      {facility.revenue === 0 ? '0' : (facility.revenue / 1000000).toFixed(1) + 'M'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Growth</p>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-gray-400 mr-1" />
                      <p className="text-xl font-bold text-gray-400">
                        0%
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <Users className="w-10 h-10 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.activeStaff} active staff
              </p>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Facilities</h3>
              <p className="text-sm text-gray-600 mt-1">{facilities.length} locations</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
