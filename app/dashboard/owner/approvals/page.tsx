'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult } from '@/types';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { userProfile } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Subscribe to submitted test results (across all facilities for owner)
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('status', '==', 'Submitted')
    );

    const unsubscribe = onSnapshot(resultsQuery, (snapshot) => {
      const resultsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        datePerformed: doc.data().datePerformed?.toDate() || new Date(),
        dateSubmitted: doc.data().dateSubmitted?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestResult[];

      setTestResults(resultsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (resultId: string) => {
    if (!userProfile) return;

    setProcessing(true);

    try {
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, resultId, {
        status: 'Approved',
        approvedBy: userProfile.id,
        dateApproved: new Date(),
      });

      alert('Test result approved successfully!');
      setSelectedResult(null);
    } catch (error) {
      console.error('Error approving result:', error);
      alert('Failed to approve result');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (resultId: string) => {
    if (!userProfile || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);

    try {
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, resultId, {
        status: 'Rejected',
        approvedBy: userProfile.id,
        dateApproved: new Date(),
        rejectionReason,
      });

      alert('Test result rejected. Lab tech will be notified.');
      setSelectedResult(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting result:', error);
      alert('Failed to reject result');
    } finally {
      setProcessing(false);
    }
  };

  const filteredResults = testResults.filter(
    (result) =>
      result.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Result Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve test results before releasing to patients
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

        {selectedResult ? (
          /* Result Detail View */
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Review Test Result</h2>
                <Button
                  size="sm"
                  onClick={() => setSelectedResult(null)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Back to List
                </Button>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Patient ID</div>
                  <div className="font-medium">{selectedResult.patient?.patientId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">
                    {selectedResult.patient?.surname} {selectedResult.patient?.givenName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Test</div>
                  <div className="font-medium">{selectedResult.test?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Performed By</div>
                  <div className="font-medium">
                    {selectedResult.performedByUser?.firstName}{' '}
                    {selectedResult.performedByUser?.lastName}
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Test Results</h3>
                <div className="space-y-3">
                  {selectedResult.resultValues.map((result, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="text-xs text-gray-600">Parameter</div>
                        <div className="font-medium">{result.parameter}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Value</div>
                        <div className="font-medium">{result.value}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Unit</div>
                        <div className="font-medium">{result.unit}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Flag</div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.flag === 'Normal'
                              ? 'bg-green-100 text-green-800'
                              : result.flag === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {result.flag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedResult.remarks && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      Lab Tech Remarks:
                    </div>
                    <div className="text-sm text-blue-800">{selectedResult.remarks}</div>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Provide a reason if you need to reject this result..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApprove(selectedResult.id)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Approve Result'}
                </Button>
                <Button
                  onClick={() => handleReject(selectedResult.id)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Reject Result'}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Results List */
          <Card>
            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No pending approvals
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'All test results have been reviewed!'}
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
                        Test
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Performed By
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Date Performed
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr
                        key={result.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium text-primary">
                          {result.patient?.patientId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {result.patient?.surname} {result.patient?.givenName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {result.test?.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {result.performedByUser?.firstName}{' '}
                          {result.performedByUser?.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {format(result.datePerformed, 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedResult(result)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
