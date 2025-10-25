'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TestTube, Search, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestRequest } from '@/types';
import { format } from 'date-fns';

export default function SampleReceptionPage() {
  const { userProfile } = useAuth();
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Get test requests that are paid but samples not yet received
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid'),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        sampleCollectionDate: doc.data().sampleCollectionDate?.toDate(),
        sampleReceivedDate: doc.data().sampleReceivedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestRequest[];

      setTestRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const handleReceiveSample = async (requestId: string) => {
    if (!userProfile) return;

    try {
      await firestoreService.update(COLLECTIONS.TEST_REQUESTS, requestId, {
        sampleReceivedDate: new Date(),
        sampleReceivedBy: userProfile.id,
        overallStatus: 'SampleReceived',
      });

      alert('Sample received successfully!');
    } catch (error) {
      console.error('Error receiving sample:', error);
      alert('Failed to receive sample');
    }
  };

  const filteredRequests = testRequests.filter(
    (request) =>
      request.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter((r) => !r.sampleReceivedDate);
  const receivedRequests = filteredRequests.filter((r) => r.sampleReceivedDate);

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
          <h1 className="text-3xl font-bold text-gray-900">Sample Reception</h1>
          <p className="text-gray-600 mt-1">
            Receive and label patient samples for testing
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

        {/* Pending Samples */}
        <Card title="Awaiting Sample Reception" className="mb-6">
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No samples awaiting reception</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tests
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Request Date
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
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-primary">
                        {request.patient?.patientId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {request.patient?.surname} {request.patient?.givenName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {request.tests.length} test(s)
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(request.requestDate, 'dd MMM yyyy HH:mm')}
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
                        <Button
                          size="sm"
                          onClick={() => handleReceiveSample(request.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Receive Sample
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Received Samples */}
        <Card title="Samples Received Today">
          {receivedRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No samples received yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tests
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Received At
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receivedRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-primary">
                        {request.patient?.patientId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {request.patient?.surname} {request.patient?.givenName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {request.tests.length} test(s)
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {request.sampleReceivedDate
                          ? format(request.sampleReceivedDate, 'dd MMM yyyy HH:mm')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Received
                        </span>
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
