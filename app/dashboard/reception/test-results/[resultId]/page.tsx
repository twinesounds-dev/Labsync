'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Download, CheckCircle, XCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult, TestRequest } from '@/types';

export default function TestResultDetailPage() {
  // const router = useRouter();
  const params = useParams();
  const resultId = params.resultId as string;
  const { userProfile } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [request, setRequest] = useState<TestRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch test result
        const resultData = await firestoreService.getById<TestResult>(
          COLLECTIONS.TEST_RESULTS,
          resultId
        );
        setResult(resultData);

        // Fetch corresponding test request
        if (resultData?.testRequestId) {
          const requestData = await firestoreService.getById<TestRequest>(
            COLLECTIONS.TEST_REQUESTS,
            resultData.testRequestId
          );
          setRequest(requestData);
        }
      } catch (error) {
        console.error('Error fetching result:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  const handleApprove = async () => {
    if (!result) return;

    setUpdating(true);
    try {
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, result.id, {
        status: 'Approved',
        approvedBy: userProfile?.id,
        approvedDate: new Date(),
      });

      setResult({ ...result, status: 'Approved' });
      alert('Test result approved successfully!');
    } catch (error) {
      console.error('Error approving result:', error);
      alert('Failed to approve result');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!result) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setUpdating(true);
    try {
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, result.id, {
        status: 'Rejected',
        rejectedBy: userProfile?.id,
        rejectedDate: new Date(),
        rejectionReason: reason,
      });

      setResult({ ...result, status: 'Rejected' });
      alert('Test result rejected');
    } catch (error) {
      console.error('Error rejecting result:', error);
      alert('Failed to reject result');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = async () => {
    if (!result) return;

    setUpdating(true);
    try {
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, result.id, {
        status: 'Printed',
        printedBy: userProfile?.id,
        printedDate: new Date(),
      });

      setResult({ ...result, status: 'Printed' });
      
      // Here you would integrate with your PDF generation service
      alert('Report printed successfully!');
    } catch (error) {
      console.error('Error printing result:', error);
      alert('Failed to print result');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Submitted': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800' },
      'Printed': { bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Submitted;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  if (loading || !result) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading test result...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/reception/test-results">
              <Button size="sm" className="mr-4 bg-gray-500 hover:bg-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Result Details</h1>
              <p className="text-gray-600 mt-1">
                Patient: {request?.patient?.surname} {request?.patient?.givenName} ({request?.patient?.patientId})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(result.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Patient Information">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Patient ID</div>
                  <div className="font-medium">{request?.patient?.patientId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">
                    {request?.patient?.surname} {request?.patient?.givenName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gender</div>
                  <div className="font-medium">{request?.patient?.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">DOB</div>
                  <div className="font-medium">{request?.patient?.dateOfBirth?.toLocaleDateString()}</div>
                </div>
              </div>
            </Card>

            {/* Test Information */}
            <Card title="Test Information">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Test Name</div>
                  <div className="font-medium">{result.test?.name || 'Unknown Test'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date Performed</div>
                  <div className="font-medium">{result.datePerformed?.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Performed By</div>
                  <div className="font-medium">{result.performedBy}</div>
                </div>
              </div>

              {request?.clerkNotes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-900 mb-1">
                    Clerk Notes:
                  </div>
                  <div className="text-sm text-blue-800">{request.clerkNotes}</div>
                </div>
              )}
            </Card>

            {/* Test Results */}
            <Card title="Test Results">
              <div className="space-y-4">
                {result.resultValues?.map((value, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Parameter</div>
                        <div className="font-medium">{value.parameter}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Value</div>
                        <div className={`font-medium ${
                          value.flag === 'High' || value.flag === 'Critical' 
                            ? 'text-red-600' 
                            : value.flag === 'Low' 
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}>
                          {value.value} {value.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Normal Range</div>
                        <div className="font-medium">{value.normalRange || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Flag</div>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            value.flag === 'High' || value.flag === 'Critical' 
                              ? 'bg-red-100 text-red-800' 
                              : value.flag === 'Low' 
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {value.flag}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.remarks && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    Lab Technician Remarks:
                  </div>
                  <div className="text-sm text-gray-700">{result.remarks}</div>
                </div>
              )}
            </Card>
          </div>

          {/* Actions Panel */}
          <div>
            <Card title="Actions" className="sticky top-4">
              <div className="space-y-4">
                {result.status === 'Submitted' && (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={updating}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Result</span>
                    </Button>

                    <Button
                      onClick={handleReject}
                      disabled={updating}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Result</span>
                    </Button>
                  </>
                )}

                {result.status === 'Approved' && (
                  <Button
                    onClick={handlePrint}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Report</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </Button>
              </div>

              {/* Status History */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Status History</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">{result.datePerformed?.toLocaleDateString()}</span>
                  </div>
                  {result.status === 'Approved' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  )}
                  {result.status === 'Printed' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Printed:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}