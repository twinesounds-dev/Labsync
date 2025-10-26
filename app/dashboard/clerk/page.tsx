'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { TestTube, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';

export default function ClerkDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    samplesAwaiting: 0,
    samplesProcessedToday: 0,
    testsPending: 0,
    sampleRejections: 0,
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

    // Subscribe to test requests
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId)
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      let samplesAwaiting = 0;
      let samplesProcessedToday = 0;
      let testsPending = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Samples awaiting reception (paid but not yet received)
        if (data.paymentStatus === 'Paid' && !data.sampleReceivedDate) {
          samplesAwaiting++;
        }

        // Samples processed today
        if (data.sampleReceivedDate && data.sampleReceivedDate >= todayTimestamp) {
          samplesProcessedToday++;
        }

        // Tests pending (payment confirmed but samples not yet received)
        if (data.paymentStatus === 'Paid' && !data.sampleReceivedDate) {
          testsPending += data.tests?.length || 0;
        }
      });

      setStats({
        samplesAwaiting,
        samplesProcessedToday,
        testsPending,
        sampleRejections: 0, // Can be tracked separately if needed
      });
      setLoading(false);
    });

    return () => unsubscribe();
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
          Clerk Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Samples Awaiting Reception
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {stats.samplesAwaiting}
                </p>
              </div>
              <TestTube className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Processed Today
                </p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {stats.samplesProcessedToday}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Tests Pending
                </p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {stats.testsPending}
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">
                  Sample Rejections
                </p>
                <p className="text-3xl font-bold text-red-900 mt-1">
                  {stats.sampleRejections}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/clerk/forms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-primary text-white">
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Request Forms</h3>
                <p className="text-sm opacity-90 mt-1">
                  Review and select tests for patients
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/clerk/sample-collection">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-secondary text-white">
              <div className="text-center py-6">
                <TestTube className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Sample Collection</h3>
                <p className="text-sm opacity-90 mt-1">
                  Collect & QA samples
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/clerk/samples">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-indigo-600 text-white">
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Sample Tracking</h3>
                <p className="text-sm opacity-90 mt-1">
                  Track sample status
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
