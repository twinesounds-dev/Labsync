'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import { BarChart, TrendingUp, DollarSign, Users, Package, Download, Calendar } from 'lucide-react';
import { Facility } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface AnalyticsOverviewProps {
  facilityId: string | 'all';
  facilities: Facility[];
}

interface FacilityMetrics {
  facilityId: string;
  facilityName: string;
  patients: number;
  revenue: number;
  tests: number;
  activeStaff: number;
  inventoryValue: number;
  expenses: number;
  netProfit: number;
}

export default function AnalyticsOverview({ facilityId, facilities }: AnalyticsOverviewProps) {
  const { userProfile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [facilityMetrics, setFacilityMetrics] = useState<FacilityMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const getPeriodStart = () => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return Timestamp.fromDate(startDate);
  };

  useEffect(() => {
    if (!userProfile) return;

    const periodStart = getPeriodStart();
    const facilitiesToTrack = facilityId === 'all' ? facilities : facilities.filter(f => f.id === facilityId);

    // Initialize metrics
    const metrics: FacilityMetrics[] = facilitiesToTrack.map(facility => ({
      facilityId: facility.id,
      facilityName: facility.name,
      patients: 0,
      revenue: 0,
      tests: 0,
      activeStaff: 0,
      inventoryValue: 0,
      expenses: 0,
      netProfit: 0,
    }));

    setFacilityMetrics(metrics);

    // Collect data for each facility
    facilitiesToTrack.forEach((facility, index) => {
      // Patients
      const patientsQuery = query(
        collection(db, COLLECTIONS.PATIENTS),
        where('facilityId', '==', facility.id),
        where('createdAt', '>=', periodStart)
      );

      onSnapshot(patientsQuery, (snapshot) => {
        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].patients = snapshot.size;
          }
          return updated;
        });
      });

      // Revenue (Payments)
      const paymentsQuery = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('facilityId', '==', facility.id),
        where('createdAt', '>=', periodStart)
      );

      onSnapshot(paymentsQuery, (snapshot) => {
        let revenue = 0;
        snapshot.docs.forEach(doc => {
          revenue += doc.data().total || 0;
        });

        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].revenue = revenue;
          }
          return updated;
        });
      });

      // Tests
      const testsQuery = query(
        collection(db, COLLECTIONS.TEST_RESULTS),
        where('facilityId', '==', facility.id),
        where('createdAt', '>=', periodStart)
      );

      onSnapshot(testsQuery, (snapshot) => {
        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].tests = snapshot.size;
          }
          return updated;
        });
      });

      // Active Staff
      const staffQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('facilityId', '==', facility.id),
        where('isActive', '==', true)
      );

      onSnapshot(staffQuery, (snapshot) => {
        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].activeStaff = snapshot.size;
          }
          return updated;
        });
      });

      // Inventory Value
      const inventoryQuery = query(
        collection(db, COLLECTIONS.INVENTORY_ITEMS),
        where('facilityId', '==', facility.id)
      );

      onSnapshot(inventoryQuery, (snapshot) => {
        let totalValue = 0;
        snapshot.docs.forEach(doc => {
          const item = doc.data();
          totalValue += (item.currentStock || 0) * (item.costPerUnit || 0);
        });

        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].inventoryValue = totalValue;
          }
          return updated;
        });
      });

      // Expenses
      const expensesQuery = query(
        collection(db, COLLECTIONS.EXPENDITURES),
        where('facilityId', '==', facility.id),
        orderBy('date', 'desc')
      );

      onSnapshot(expensesQuery, (snapshot) => {
        let totalExpenses = 0;
        snapshot.docs.forEach(doc => {
          const expense = doc.data();
          const expDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
          if (expDate >= periodStart.toDate()) {
            totalExpenses += expense.amount || 0;
          }
        });

        setFacilityMetrics(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].expenses = totalExpenses;
            updated[index].netProfit = updated[index].revenue - totalExpenses;
          }
          return updated;
        });
      });
    });

    setLoading(false);
  }, [userProfile, facilityId, facilities, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `UGX ${(amount / 1000000).toFixed(1)}M`;
    }
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const getTotalMetrics = () => {
    return facilityMetrics.reduce((acc, metric) => ({
      patients: acc.patients + metric.patients,
      revenue: acc.revenue + metric.revenue,
      tests: acc.tests + metric.tests,
      activeStaff: acc.activeStaff + metric.activeStaff,
      inventoryValue: acc.inventoryValue + metric.inventoryValue,
      expenses: acc.expenses + metric.expenses,
      netProfit: acc.netProfit + metric.netProfit,
    }), {
      patients: 0,
      revenue: 0,
      tests: 0,
      activeStaff: 0,
      inventoryValue: 0,
      expenses: 0,
      netProfit: 0,
    });
  };

  const totalMetrics = getTotalMetrics();

  const exportToCSV = () => {
    const headers = ['Facility', 'Patients', 'Revenue', 'Tests', 'Staff', 'Inventory Value', 'Expenses', 'Net Profit'];
    const rows = facilityMetrics.map(m => [
      m.facilityName,
      m.patients,
      m.revenue,
      m.tests,
      m.activeStaff,
      m.inventoryValue,
      m.expenses,
      m.netProfit,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facility-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Overall Summary */}
      {facilityId === 'all' && (
        <Card title="Overall Performance Summary" className="border-primary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{totalMetrics.patients.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalMetrics.revenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tests</p>
              <p className="text-3xl font-bold text-gray-900">{totalMetrics.tests.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Profit</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalMetrics.netProfit)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Facility Comparison Table */}
      <Card title="Facility Comparison">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Facility</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Patients</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Tests</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Staff</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Inventory</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Expenses</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {facilityMetrics.map((metric) => (
                <tr key={metric.facilityId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-900">{metric.facilityName}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {metric.patients.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">
                    {formatCurrency(metric.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {metric.tests.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {metric.activeStaff}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(metric.inventoryValue)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-red-600">
                    {formatCurrency(metric.expenses)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {formatCurrency(metric.netProfit)}
                  </td>
                </tr>
              ))}
              {facilityId === 'all' && facilityMetrics.length > 1 && (
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-3 px-4 text-gray-900">TOTAL</td>
                  <td className="py-3 px-4 text-right text-gray-900">{totalMetrics.patients.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totalMetrics.revenue)}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{totalMetrics.tests.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{totalMetrics.activeStaff}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(totalMetrics.inventoryValue)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalMetrics.expenses)}</td>
                  <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(totalMetrics.netProfit)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Top Performing Facility" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          {facilityMetrics.length > 0 && (
            (() => {
              const topFacility = [...facilityMetrics].sort((a, b) => b.revenue - a.revenue)[0];
              return (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-green-900 mb-2">{topFacility.facilityName}</p>
                  <p className="text-sm text-green-700">Revenue: {formatCurrency(topFacility.revenue)}</p>
                  <p className="text-sm text-green-700">{topFacility.patients} patients served</p>
                </div>
              );
            })()
          )}
        </Card>

        <Card title="Highest Patient Volume" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          {facilityMetrics.length > 0 && (
            (() => {
              const topFacility = [...facilityMetrics].sort((a, b) => b.patients - a.patients)[0];
              return (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-blue-900 mb-2">{topFacility.facilityName}</p>
                  <p className="text-sm text-blue-700">{topFacility.patients} patients</p>
                  <p className="text-sm text-blue-700">{topFacility.tests} tests performed</p>
                </div>
              );
            })()
          )}
        </Card>

        <Card title="Best Profit Margin" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          {facilityMetrics.length > 0 && (
            (() => {
              const topFacility = [...facilityMetrics]
                .filter(f => f.revenue > 0)
                .sort((a, b) => (b.netProfit / b.revenue) - (a.netProfit / a.revenue))[0];
              
              if (!topFacility) {
                return <div className="text-center py-4 text-gray-500">No data available</div>;
              }

              const margin = ((topFacility.netProfit / topFacility.revenue) * 100).toFixed(1);
              return (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-purple-900 mb-2">{topFacility.facilityName}</p>
                  <p className="text-sm text-purple-700">Profit Margin: {margin}%</p>
                  <p className="text-sm text-purple-700">Net: {formatCurrency(topFacility.netProfit)}</p>
                </div>
              );
            })()
          )}
        </Card>
      </div>

      {/* Key Insights */}
      <Card title="Key Insights & Recommendations">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Revenue Growth</p>
                <p className="text-sm text-gray-700">
                  Overall revenue is trending upward with an average of {formatCurrency(totalMetrics.revenue / facilityMetrics.length)} per facility.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-3">
              <Package className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Inventory Management</p>
                <p className="text-sm text-gray-700">
                  Total inventory value across all facilities: {formatCurrency(totalMetrics.inventoryValue)}. 
                  Monitor stock levels to optimize capital allocation.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Staffing Efficiency</p>
                <p className="text-sm text-gray-700">
                  {totalMetrics.activeStaff} active staff members serving {totalMetrics.patients} patients. 
                  Average of {(totalMetrics.patients / totalMetrics.activeStaff).toFixed(0)} patients per staff member.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-purple-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Profitability</p>
                <p className="text-sm text-gray-700">
                  Net profit margin: {totalMetrics.revenue > 0 ? ((totalMetrics.netProfit / totalMetrics.revenue) * 100).toFixed(1) : 0}%. 
                  {totalMetrics.netProfit > 0 ? 'Strong performance across facilities.' : 'Consider cost optimization strategies.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
