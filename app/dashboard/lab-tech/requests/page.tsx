'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TestTube, Search, Eye } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { TestRequest } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function LabRequestsPage() {
  const { userProfile } = useAuth();
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Get test requests that are paid and samples received
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid'),
      orderBy('requestDate', 'desc')
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
        .filter((req) => req.sampleReceivedDate) as TestRequest[];

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
          <h1 className="text-3xl font-bold text-gray-900">Lab Requests</h1>
          <p className="text-gray-600 mt-1">
            View paid patients with samples ready for testing
          </p>
        </div>

        {/* Search */}
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

        {/* Lab Requests */}
        <Card>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No lab requests found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Lab requests will appear here once samples are received'}
              </p>
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
                      Tests Required
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Clerk Notes
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
                  {filteredRequests.map((request) => (
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
                        <div className="text-sm text-gray-500">
                          {request.patient?.gender}, {request.patient?.phoneNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {request.tests.map((test, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-gray-700 flex items-center gap-2"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  test.status === 'Completed'
                                    ? 'bg-green-500'
                                    : test.status === 'InProgress'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                              {test.test?.name || test.testId}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                        {request.clerkNotes || 'No notes'}
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
                          <Button size="sm" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Enter Results
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
