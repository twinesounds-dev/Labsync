'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { TestTube, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { TestRequest } from '@/types';

export default function ClerkDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    samplesAwaiting: 0,
    samplesProcessedToday: 0,
    testsPending: 0,
    sampleRejections: 0,
    walkInPatientsWaiting: 0,
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

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
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

      setStats((prev) => ({
        ...prev,
        samplesAwaiting,
        samplesProcessedToday,
        testsPending,
        sampleRejections: 0, // Can be tracked separately if needed
      }));
      setLoading(false);
    });

    // Subscribe to walk-in patients waiting for lab request
    const patientsQuery = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('facilityId', '==', userProfile.facilityId),
      where('requiresClerkRequest', '==', true)
    );

    const unsubscribePatients = onSnapshot(patientsQuery, async (snapshot) => {
      // Check which patients don't have a test request yet
      let walkInWaiting = 0;
      
      for (const patientDoc of snapshot.docs) {
        const patientId = patientDoc.id;
        
        const requestSnapshot = await firestoreService.getAll<TestRequest>(COLLECTIONS.TEST_REQUESTS);
        const hasRequest = requestSnapshot.some((req) => req.patientId === patientId);
        
        if (!hasRequest) {
          walkInWaiting++;
        }
      }
      
      setStats((prev) => ({ ...prev, walkInPatientsWaiting: walkInWaiting }));
    });

    return () => {
      unsubscribeRequests();
      unsubscribePatients();
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
          Clerk Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Walk-ins Waiting
                </p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {stats.walkInPatientsWaiting}
                </p>
                <p className="text-xs text-orange-600 mt-1">Need lab request</p>
              </div>
              <Users className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Samples Awaiting
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {stats.samplesAwaiting}
                </p>
                <p className="text-xs text-blue-600 mt-1">Paid patients</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/clerk/walk-in-patients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-orange-600 text-white">
              <div className="text-center py-6">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Walk-in Patients</h3>
                <p className="text-sm opacity-90 mt-1">
                  Create lab requests ({stats.walkInPatientsWaiting} waiting)
                </p>
              </div>
            </Card>
          </Link>

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
                  Collect & QA samples ({stats.samplesAwaiting} ready)
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
