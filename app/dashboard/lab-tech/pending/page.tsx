'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Clock, Search } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { TestRequest } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PendingResultsPage() {
  const { userProfile } = useAuth();
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          requestDate: doc.data().requestDate?.toDate() || new Date(),
          sampleReceivedDate: doc.data().sampleReceivedDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))
        .filter(
          (req) =>
            req.sampleReceivedDate &&
            req.tests.some((t) => t.status === 'Pending' || t.status === 'InProgress')
        ) as TestRequest[];

      setTestRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const filteredRequests = testRequests.filter(
    (request) =>
      request.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pending Results</h1>
          <p className="text-gray-600 mt-1">Tests awaiting completion and entry</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by patient ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none focus:ring-0"
            />
          </div>
        </Card>

        <Card>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No pending tests
              </h3>
              <p className="text-gray-600">All tests have been completed!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Pending Tests
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Sample Received
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Urgency
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const pendingTests = request.tests.filter(
                      (t) => t.status === 'Pending' || t.status === 'InProgress'
                    );
                    return (
                      <tr
                        key={request.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium text-primary">
                          {request.patient?.patientId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {request.patient?.surname} {request.patient?.givenName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {pendingTests.map((test, idx) => (
                              <div key={idx} className="text-sm text-gray-700">
                                {test.test?.name || test.testId}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.sampleReceivedDate
                            ? format(request.sampleReceivedDate, 'dd MMM yyyy HH:mm')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.patient?.urgency === 'STAT'
                                ? 'bg-red-100 text-red-800'
                                : request.patient?.urgency === 'Urgent'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {request.patient?.urgency}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/lab-tech/results/${request.id}`}>
                            <Button size="sm">Enter Results</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
