'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { TestTube, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClerkDashboard() {
  const [stats, setStats] = useState({
    samplesAwaiting: 0,
    samplesProcessedToday: 0,
    testsPending: 0,
    sampleRejections: 0,
  });

  const loadDashboardStats = async () => {
    try {
      // Get all test requests
      const testRequests = await firestoreService.getAll(COLLECTIONS.TEST_REQUESTS);
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate samples awaiting reception
      const samplesAwaiting = testRequests.filter((tr: any) => 
        tr.overallStatus === 'Pending' && tr.paymentStatus === 'Paid'
      ).length;

      // Calculate samples processed today
      const samplesProcessedToday = testRequests.filter((tr: any) => {
        const receivedDate = tr.sampleReceivedDate?.toDate ? tr.sampleReceivedDate.toDate() : new Date(tr.sampleReceivedDate);
        return receivedDate >= today && tr.overallStatus !== 'Pending';
      }).length;

      // Calculate tests pending (samples received but not yet in progress)
      const testsPending = testRequests.filter((tr: any) => 
        tr.overallStatus === 'SampleReceived'
      ).length;

      // Sample rejections would be tracked separately - for now set to 0
      const sampleRejections = 0;

      setStats({
        samplesAwaiting,
        samplesProcessedToday,
        testsPending,
        sampleRejections,
      });
    } catch (error) {
      console.error('Error loading clerk dashboard stats:', error);
      setStats({
        samplesAwaiting: 0,
        samplesProcessedToday: 0,
        testsPending: 0,
        sampleRejections: 0,
      });
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

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
          <Link href="/dashboard/clerk/samples">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-primary text-white">
              <div className="text-center py-6">
                <TestTube className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Receive Samples</h3>
                <p className="text-sm opacity-90 mt-1">
                  Process incoming samples
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/clerk/tests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-secondary text-white">
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Select Tests</h3>
                <p className="text-sm opacity-90 mt-1">
                  Choose tests for samples
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/clerk/forms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-indigo-600 text-white">
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">External Forms</h3>
                <p className="text-sm opacity-90 mt-1">
                  Process external requests
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
