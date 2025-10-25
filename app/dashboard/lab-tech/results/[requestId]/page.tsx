'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestRequest, TestResult, ResultValue } from '@/types';

export default function EnterResultsPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const { userProfile } = useAuth();

  const [request, setRequest] = useState<TestRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ [testId: string]: ResultValue[] }>({});
  const [remarks, setRemarks] = useState<{ [testId: string]: string }>({});

  useEffect(() => {
    const fetchRequest = async () => {
      const requestData = await firestoreService.getById<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        requestId
      );
      setRequest(requestData);

      // Initialize result data structure
      if (requestData) {
        const initialData: { [testId: string]: ResultValue[] } = {};
        const initialRemarks: { [testId: string]: string } = {};

        requestData.tests.forEach((test) => {
          initialData[test.testId] = [
            {
              parameter: 'Result',
              value: '',
              unit: '',
              normalRange: '',
              flag: 'Normal',
            },
          ];
          initialRemarks[test.testId] = '';
        });

        setResultData(initialData);
        setRemarks(initialRemarks);
      }

      setLoading(false);
    };

    fetchRequest();
  }, [requestId]);

  const handleResultChange = (
    testId: string,
    index: number,
    field: keyof ResultValue,
    value: string
  ) => {
    setResultData((prev) => ({
      ...prev,
      [testId]: prev[testId].map((result, idx) =>
        idx === index ? { ...result, [field]: value } : result
      ),
    }));
  };

  const handleSubmitResults = async () => {
    if (!request || !userProfile) return;

    setSubmitting(true);

    try {
      // Create test results for each test
      for (const test of request.tests) {
        const resultValues = resultData[test.testId];

        await firestoreService.create<TestResult>(COLLECTIONS.TEST_RESULTS, {
          testRequestId: request.id,
          testId: test.testId,
          patientId: request.patientId,
          facilityId: userProfile.facilityId,
          resultValues,
          remarks: remarks[test.testId],
          datePerformed: new Date(),
          performedBy: userProfile.id,
          status: 'Submitted',
        } as Partial<TestResult>);

        // Update test status in request
        await firestoreService.update(COLLECTIONS.TEST_REQUESTS, request.id, {
          [`tests.${request.tests.indexOf(test)}.status`]: 'Completed',
          overallStatus: 'Completed',
        });
      }

      alert('Results submitted successfully for approval!');
      router.push('/dashboard/lab-tech/pending');
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Failed to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !request) {
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/lab-tech/requests">
              <Button size="sm" className="mr-4 bg-gray-500 hover:bg-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enter Test Results</h1>
              <p className="text-gray-600 mt-1">
                Patient: {request.patient?.surname} {request.patient?.givenName} (
                {request.patient?.patientId})
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Patient Info Card */}
          <Card title="Patient Information">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Patient ID</div>
                <div className="font-medium">{request.patient?.patientId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-medium">
                  {request.patient?.surname} {request.patient?.givenName}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gender</div>
                <div className="font-medium">{request.patient?.gender}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Urgency</div>
                <div>
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
                </div>
              </div>
            </div>
            {request.clerkNotes && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-sm font-semibold text-blue-900 mb-1">
                  Clerk Notes:
                </div>
                <div className="text-sm text-blue-800">{request.clerkNotes}</div>
              </div>
            )}
          </Card>

          {/* Test Results Forms */}
          {request.tests.map((test, testIndex) => (
            <Card key={test.testId} title={test.test?.name || `Test ${testIndex + 1}`}>
              <div className="space-y-4">
                {resultData[test.testId]?.map((result, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      label="Parameter"
                      value={result.parameter}
                      onChange={(e) =>
                        handleResultChange(
                          test.testId,
                          index,
                          'parameter',
                          e.target.value
                        )
                      }
                      placeholder="e.g., Hemoglobin"
                    />
                    <Input
                      label="Value"
                      value={result.value}
                      onChange={(e) =>
                        handleResultChange(test.testId, index, 'value', e.target.value)
                      }
                      placeholder="e.g., 14.5"
                      required
                    />
                    <Input
                      label="Unit"
                      value={result.unit}
                      onChange={(e) =>
                        handleResultChange(test.testId, index, 'unit', e.target.value)
                      }
                      placeholder="e.g., g/dL"
                    />
                    <Select
                      label="Flag"
                      value={result.flag}
                      onChange={(e) =>
                        handleResultChange(test.testId, index, 'flag', e.target.value)
                      }
                      options={[
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Low', label: 'Low' },
                        { value: 'High', label: 'High' },
                        { value: 'Critical', label: 'Critical' },
                        { value: 'N/A', label: 'N/A' },
                      ]}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks / Observations
                  </label>
                  <textarea
                    value={remarks[test.testId] || ''}
                    onChange={(e) =>
                      setRemarks({ ...remarks, [test.testId]: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add any observations or notes..."
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitResults}
              disabled={submitting}
              className="flex items-center gap-2"
              size="lg"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? 'Submitting...' : 'Submit Results for Approval'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
