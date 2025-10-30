'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { FlaskConical, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';

export default function LabTechDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    pendingTests: 0,
    completedToday: 0,
    urgentTests: 0,
    qcAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // Subscribe to test requests for pending tests
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      let pendingTests = 0;
      let urgentTests = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Count tests that have been paid for and sample received
        if (data.sampleReceivedDate && Array.isArray(data.tests)) {
          data.tests.forEach((test: { status: string }) => {
            if (test.status === 'Pending' || test.status === 'InProgress') {
              pendingTests++;
            }
          });
        }

        // Count urgent tests
        if (data.patient?.urgency === 'Urgent' || data.patient?.urgency === 'STAT') {
          urgentTests++;
        }
      });

      setStats((prev) => ({ ...prev, pendingTests, urgentTests }));
    });

    // Subscribe to test results for completed today
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId)
    );

    const unsubscribeResults = onSnapshot(resultsQuery, (snapshot) => {
      const completedToday = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.datePerformed && data.datePerformed >= todayTimestamp;
      }).length;

      setStats((prev) => ({ ...prev, completedToday }));
      setLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeResults();
    };
  }, [userProfile?.facilityId]);

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
          Lab Technician Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Pending Tests
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {stats.pendingTests}
                </p>
              </div>
              <FlaskConical className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Completed Today
                </p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {stats.completedToday}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Urgent Tests
                </p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {stats.urgentTests}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">QC Alerts</p>
                <p className="text-3xl font-bold text-red-900 mt-1">
                  {stats.qcAlerts}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/lab-tech/requests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-primary text-white">
              <div className="text-center py-6">
                <FlaskConical className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Lab Requests</h3>
                <p className="text-sm opacity-90 mt-1">
                  View paid patients ready for testing
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/lab-tech/pending">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-secondary text-white">
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Pending Tests</h3>
                <p className="text-sm opacity-90 mt-1">
                  Tests awaiting results
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/lab-tech/results">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-green-600 text-white">
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Enter Results</h3>
                <p className="text-sm opacity-90 mt-1">
                  Enter test results
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/lab-tech/qc">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-indigo-600 text-white">
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Quality Control</h3>
                <p className="text-sm opacity-90 mt-1">
                  View QC documentation
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
