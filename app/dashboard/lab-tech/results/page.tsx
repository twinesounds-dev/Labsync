'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TestTube, Eye, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { TestRequest } from '@/types';

export default function LabResultsPage() {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test requests that have samples received and are ready for results entry
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid'),
      where('sampleReceivedDate', '!=', null),
      orderBy('sampleReceivedDate', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...data,
          requestDate: data.requestDate?.toDate?.() || new Date(),
          sampleReceivedDate: data.sampleReceivedDate?.toDate?.() || null,
          tests: Array.isArray(data.tests) ? data.tests : [],
        } as TestRequest;
      });

      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'InProgress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: TestTube },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      'STAT': { bg: 'bg-red-100', text: 'text-red-800' },
      'Urgent': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'Routine': { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.Routine;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {urgency}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading test requests...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Results Entry</h1>
          <p className="text-gray-600 mt-1">
            Enter results for tests with collected samples
          </p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tests Ready for Results
              </h3>
              <p className="text-gray-600">
                Tests will appear here once samples have been collected and received.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.patient?.surname} {request.patient?.givenName}
                        </h3>
                        <span className="text-sm text-gray-600">
                          ID: {request.patient?.patientId}
                        </span>
                        {getUrgencyBadge(request.patient?.urgency || 'Routine')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Sample Received: {request.sampleReceivedDate?.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Gender: </span>
                        <span className="font-medium">{request.patient?.gender}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">DOB: </span>
                        <span className="font-medium">{request.patient?.dateOfBirth?.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Tests: </span>
                        <span className="font-medium">{request.tests?.length || 0}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tests Requested:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(request.tests) && request.tests.length > 0 ? (
                          request.tests.map((test, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-800">{test.test?.name || `Test ${index + 1}`}</span>
                              {getStatusBadge(test.status)}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No tests</span>
                        )}
                      </div>
                    </div>

                    {request.clerkNotes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-900">Clerk Notes: </span>
                        <span className="text-sm text-blue-800">{request.clerkNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Link href={`/dashboard/lab-tech/results/${request.id}`}>
                      <Button size="sm" className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Enter Results</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}