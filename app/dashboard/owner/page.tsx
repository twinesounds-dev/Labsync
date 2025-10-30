'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import {
  Building2,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { Facility } from '@/types';
import FinancialManagement from './financial/FinancialManagement';
import InventoryManagement from './inventory/InventoryManagement';
import HRManagement from './hr/HRManagement';
import AnalyticsOverview from './analytics/AnalyticsOverview';

export default function OwnerDashboard() {
  const { userProfile } = useAuth();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'inventory' | 'hr' | 'analytics'>('overview');
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [stats, setStats] = useState({
    patients: 0,
    todayPatients: 0,
    revenue: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    activeStaff: 0,
    lowStockItems: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get today's start timestamp
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(today);
  };

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    const todayStart = getTodayStart();
    const unsubscribers: (() => void)[] = [];

    // Subscribe to facilities
    const facilitiesQuery = query(collection(db, COLLECTIONS.FACILITIES), orderBy('name'));
    const unsubFacilities = onSnapshot(facilitiesQuery, (snapshot) => {
      const facilitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Facility[];
      setFacilities(facilitiesData);
    });
    unsubscribers.push(unsubFacilities);

    // Function to create facility-filtered query
    const getFacilityQuery = (collectionName: string, facilityField = 'facilityId') => {
      if (selectedFacilityId === 'all') {
        return query(collection(db, collectionName));
      }
      return query(collection(db, collectionName), where(facilityField, '==', selectedFacilityId));
    };

    // Subscribe to patients
    const patientsQuery = getFacilityQuery(COLLECTIONS.PATIENTS);
    const unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
      const totalPatients = snapshot.size;
      const todayPatients = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.createdAt >= todayStart;
      }).length;

      setStats((prev) => ({ ...prev, patients: totalPatients, todayPatients }));
    });
    unsubscribers.push(unsubPatients);

    // Subscribe to payments for revenue
    const paymentsQuery = getFacilityQuery(COLLECTIONS.PAYMENTS);
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalRevenue = 0;
      let todayRevenue = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.total || 0;

        if (data.createdAt >= todayStart) {
          todayRevenue += data.total || 0;
        }
      });

      setStats((prev) => ({ ...prev, revenue: totalRevenue, todayRevenue }));
    });
    unsubscribers.push(unsubPayments);

    // Subscribe to test results for pending approvals
    const resultsQuery = getFacilityQuery(COLLECTIONS.TEST_RESULTS);
    const unsubResults = onSnapshot(resultsQuery, (snapshot) => {
      const pendingApprovals = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.status === 'Submitted';
      }).length;

      setStats((prev) => ({ ...prev, pendingApprovals }));
    });
    unsubscribers.push(unsubResults);

    // Subscribe to users for active staff
    const usersQuery = selectedFacilityId === 'all' 
      ? query(collection(db, COLLECTIONS.USERS))
      : query(collection(db, COLLECTIONS.USERS), where('facilityId', '==', selectedFacilityId));
    
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const activeStaff = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.isActive === true;
      }).length;

      setStats((prev) => ({ ...prev, activeStaff }));
    });
    unsubscribers.push(unsubUsers);

    // Subscribe to stock alerts
    const stockAlertsQuery = getFacilityQuery(COLLECTIONS.STOCK_ALERTS);
    const unsubStockAlerts = onSnapshot(stockAlertsQuery, (snapshot) => {
      const lowStockItems = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return !data.acknowledged && (data.alertType === 'low_stock' || data.alertType === 'out_of_stock');
      }).length;

      setStats((prev) => ({ ...prev, lowStockItems }));
    });
    unsubscribers.push(unsubStockAlerts);

    // Subscribe to leave requests
    const leaveRequestsQuery = getFacilityQuery(COLLECTIONS.LEAVE_REQUESTS);
    const unsubLeaveRequests = onSnapshot(leaveRequestsQuery, (snapshot) => {
      const pendingLeaves = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.status === 'pending';
      }).length;

      setStats((prev) => ({ ...prev, pendingLeaves }));
    });
    unsubscribers.push(unsubLeaveRequests);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userProfile, selectedFacilityId]);

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Multi-Facility Management Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive oversight and control of all LabSync facilities
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/owner/facilities/new'}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Facility
          </button>
        </div>

        {/* Facility Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Facility</h2>
            <span className="text-sm text-gray-600">
              {selectedFacilityId === 'all' ? 'Viewing all facilities' : 'Viewing single facility'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedFacilityId('all')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFacilityId === 'all'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className={`w-6 h-6 ${selectedFacilityId === 'all' ? 'text-primary' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">All Facilities</p>
                  <p className="text-xs text-gray-600">{facilities.length} locations</p>
                </div>
              </div>
            </button>

            {facilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => setSelectedFacilityId(facility.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedFacilityId === facility.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className={`w-6 h-6 ${selectedFacilityId === facility.id ? 'text-primary' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{facility.name}</p>
                    <p className="text-xs text-gray-600">{facility.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'financial', label: 'Financial Management', icon: DollarSign },
              { id: 'inventory', label: 'Inventory & Consumables', icon: Package },
              { id: 'hr', label: 'Human Resources', icon: Users },
              { id: 'analytics', label: 'Analytics & Reports', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real-time Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Patients Today</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{stats.todayPatients}</p>
                    <p className="text-xs text-blue-600 mt-1">Total: {stats.patients}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500 opacity-50" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Today&apos;s Income</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {formatCurrency(stats.todayRevenue)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Total: {formatCurrency(stats.revenue)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-500 opacity-50" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
                <div className="flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Pending Approvals</p>
                    <p className="text-3xl font-bold text-orange-900 mt-1">{stats.pendingApprovals}</p>
                    <p className="text-xs text-orange-600 mt-1">Click to review</p>
                  </div>
                  <CheckCircle2 className="w-12 h-12 text-orange-500 opacity-50" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
                <div className="flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Low Stock Alerts</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">{stats.lowStockItems}</p>
                    <p className="text-xs text-red-600 mt-1">Requires attention</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('financial')}>
                <div className="text-center py-4">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Financial Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Income & expenses</p>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('inventory')}>
                <div className="text-center py-4">
                  <Package className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Inventory Control</h3>
                  <p className="text-sm text-gray-600 mt-1">{stats.lowStockItems} alerts</p>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('hr')}>
                <div className="text-center py-4">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">HR & Attendance</h3>
                  <p className="text-sm text-gray-600 mt-1">{stats.activeStaff} active staff</p>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('analytics')}>
                <div className="text-center py-4">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 text-teal-600" />
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-gray-600 mt-1">View reports</p>
                </div>
              </Card>
            </div>

            {/* Facility Performance Comparison */}
            {selectedFacilityId === 'all' && (
              <Card title="Facility Performance Comparison" className="mt-6">
                <div className="space-y-4">
                  {facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => setSelectedFacilityId(facility.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Building2 className="w-8 h-8 text-primary mr-3" />
                          <div>
                            <h3 className="font-semibold text-lg">{facility.name}</h3>
                            <p className="text-sm text-gray-600">{facility.code}</p>
                          </div>
                        </div>
                        <button className="text-primary hover:underline text-sm">View Details →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Pending Actions">
                <div className="space-y-3">
                  {stats.pendingApprovals > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">{stats.pendingApprovals} test results</p>
                          <p className="text-sm text-gray-600">Awaiting approval</p>
                        </div>
                      </div>
                      <button className="text-primary hover:underline text-sm">Review</button>
                    </div>
                  )}
                  {stats.pendingLeaves > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{stats.pendingLeaves} leave requests</p>
                          <p className="text-sm text-gray-600">Pending approval</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('hr')}
                        className="text-primary hover:underline text-sm"
                      >
                        Review
                      </button>
                    </div>
                  )}
                  {stats.lowStockItems > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">{stats.lowStockItems} low stock items</p>
                          <p className="text-sm text-gray-600">Reorder needed</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('inventory')}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </button>
                    </div>
                  )}
                  {stats.pendingApprovals === 0 && stats.pendingLeaves === 0 && stats.lowStockItems === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>All caught up! No pending actions.</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card title="System Status">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-gray-900">All systems operational</p>
                        <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{stats.activeStaff} active staff members</p>
                        <p className="text-sm text-gray-600">Across all facilities</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{facilities.length} facilities</p>
                        <p className="text-sm text-gray-600">Under management</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <FinancialManagement facilityId={selectedFacilityId} />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagement facilityId={selectedFacilityId} />
        )}

        {activeTab === 'hr' && (
          <HRManagement facilityId={selectedFacilityId} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsOverview facilityId={selectedFacilityId} facilities={facilities} />
        )}
      </div>
    </DashboardLayout>
  );
}
