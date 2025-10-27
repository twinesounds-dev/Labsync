'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircle, XCircle, Search, Eye, FileText, Printer } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult, Facility, Patient, Test, User, TestRequest } from '@/types';
import ClinicalReport from '@/components/reports/ClinicalReport';

interface ExtendedTestResult extends TestResult {
  patient?: Patient;
  test?: Test;
  performedByUser?: User;
  testRequest?: TestRequest;
}

export default function ApprovalsPage() {
  const { userProfile } = useAuth();
  const [testResults, setTestResults] = useState<ExtendedTestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ExtendedTestResult | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Load facility data
    const loadFacility = async () => {
      try {
        const facilityData = await firestoreService.getById<Facility>(COLLECTIONS.FACILITIES, userProfile.facilityId);
        setFacility(facilityData);
      } catch (error) {
        console.error('Error loading facility:', error);
      }
    };

    loadFacility();

    // Subscribe to submitted test results for this facility
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId),
      where('status', '==', 'Submitted')
    );

    const unsubscribe = onSnapshot(resultsQuery, async (snapshot) => {
      const resultsData: ExtendedTestResult[] = [];

      for (const doc of snapshot.docs) {
        const resultData = {
          id: doc.id,
          ...doc.data(),
          datePerformed: doc.data().datePerformed?.toDate() || new Date(),
          dateSubmitted: doc.data().dateSubmitted?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as ExtendedTestResult;

        // Load patient data
        if (resultData.patientId) {
          try {
            const patient = await firestoreService.getById(COLLECTIONS.PATIENTS, resultData.patientId);
            resultData.patient = patient as Patient;
          } catch (error) {
            console.error('Error loading patient:', error);
          }
        }

        // Load test data
        if (resultData.testId) {
          try {
            const test = await firestoreService.getById(COLLECTIONS.TESTS, resultData.testId);
            resultData.test = test as Test;
          } catch (error) {
            console.error('Error loading test:', error);
          }
        }

        // Load performed by user data
        if (resultData.performedBy) {
          try {
            const user = await firestoreService.getById(COLLECTIONS.USERS, resultData.performedBy);
            resultData.performedByUser = user as User;
          } catch (error) {
            console.error('Error loading user:', error);
          }
        }

        // Load test request data
        if (resultData.testRequestId) {
          try {
            const testRequest = await firestoreService.getById(COLLECTIONS.TEST_REQUESTS, resultData.testRequestId);
            resultData.testRequest = testRequest as TestRequest;
          } catch (error) {
            console.error('Error loading test request:', error);
          }
        }

        resultsData.push(resultData);
      }

      setTestResults(resultsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const handleApprove = async (resultId: string) => {
    if (!userProfile) return;

    setProcessing(true);

    try {
      // Update test result status
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, resultId, {
        status: 'Approved',
        approvedBy: userProfile.id,
        dateApproved: new Date(),
        updatedAt: new Date(),
      });

      // Update test request overall status
      const result = testResults.find(r => r.id === resultId);
      if (result?.testRequestId) {
        await firestoreService.update(COLLECTIONS.TEST_REQUESTS, result.testRequestId, {
          overallStatus: 'Approved',
          updatedAt: new Date(),
        });
      }

      alert('Test result approved successfully! Report is now ready for printing.');
      // Don't close the modal, show the report instead
      setShowReport(true);
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

  const handleGenerateReport = (result: ExtendedTestResult) => {
    setSelectedResult(result);
    setShowReport(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleSendToReception = async (resultId: string) => {
    try {
      setProcessing(true);
      
      // Mark the report as ready for printing at reception
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, resultId, {
        printedBy: null, // Will be set when reception prints
        printedDate: null, // Will be set when reception prints
        status: 'Approved', // Keep as approved but ready for printing
        reportReadyForPrint: true,
        sentToReceptionAt: new Date(),
        updatedAt: new Date(),
      });

      alert('Report sent to reception for printing successfully!');
      setSelectedResult(null);
      setShowReport(false);
    } catch (error) {
      console.error('Error sending to reception:', error);
      alert('Failed to send report to reception');
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

        {selectedResult && showReport ? (
          /* Clinical Report View */
          <div className="space-y-6">
            {/* Report Actions */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Clinical Report</h2>
                  <p className="text-sm text-gray-600">
                    Patient: {selectedResult.patient?.surname}, {selectedResult.patient?.givenName} 
                    ({selectedResult.patient?.patientId})
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReport(false)}
                  >
                    Back to Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintReport}
                    className="no-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                  <Button
                    onClick={() => handleSendToReception(selectedResult.id)}
                    isLoading={processing}
                    className="no-print"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Send to Reception
                  </Button>
                </div>
              </div>
            </Card>

            {/* Clinical Report */}
            {facility && selectedResult.test && selectedResult.patient && (
              <ClinicalReport
                testResult={selectedResult}
                patient={selectedResult.patient}
                test={selectedResult.test}
                facility={facility}
                performedBy={selectedResult.performedByUser}
                approvedBy={userProfile || undefined}
                reportId={`RPT-${selectedResult.id.slice(-8).toUpperCase()}`}
              />
            )}
          </div>
        ) : selectedResult ? (
          /* Result Detail View */
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Review Test Result</h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedResult(null);
                    setShowReport(false);
                    setRejectionReason('');
                  }}
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
                  {processing ? 'Processing...' : 'Approve & Generate Report'}
                </Button>
                <Button
                  onClick={() => handleGenerateReport(selectedResult)}
                  disabled={processing}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-5 h-5" />
                  Preview Report
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
                          {result.datePerformed.toLocaleDateString('en-GB')} {result.datePerformed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
