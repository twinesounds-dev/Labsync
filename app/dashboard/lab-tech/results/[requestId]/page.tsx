'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, CheckCircle, User, Calendar, Phone, MapPin, TestTube, Beaker, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestRequest, TestResult, ResultValue, Patient, Test } from '@/types';
import { getNormalRangesForTest } from '@/lib/clinical-ranges';
import { getSampleTypeName } from '@/lib/sample-mapping';

export default function EnterResultsPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const { userProfile } = useAuth();

  const [request, setRequest] = useState<TestRequest | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ [testId: string]: ResultValue[] }>({});
  const [remarks, setRemarks] = useState<{ [testId: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch test request
        const requestData = await firestoreService.getById<TestRequest>(
          COLLECTIONS.TEST_REQUESTS,
          requestId
        );
        setRequest(requestData);

        if (!requestData) {
          setLoading(false);
          return;
        }

        // Fetch patient details
        if (requestData.patientId) {
          const patientData = await firestoreService.getById<Patient>(
            COLLECTIONS.PATIENTS,
            requestData.patientId
          );
          setPatient(patientData);
        }

        // Fetch test details and initialize result data
        const initialData: { [testId: string]: ResultValue[] } = {};
        const initialRemarks: { [testId: string]: string } = {};
        const testsDetails: Test[] = [];

        for (const testItem of requestData.tests) {
          const test = await firestoreService.getById<Test>(
            COLLECTIONS.TESTS,
            testItem.testId
          );
          
          if (test) {
            testsDetails.push(test);
            
            // Get normal ranges for this test
            const normalRanges = getNormalRangesForTest(test.code);
            
            if (normalRanges && normalRanges.parameters.length > 0) {
              // Initialize with parameters from normal ranges
              initialData[test.id] = normalRanges.parameters.map((param) => ({
                parameter: param.parameter,
                value: '',
                unit: param.unit,
                normalRange: patient?.gender === 'Male' && param.normalRangeMale
                  ? param.normalRangeMale
                  : patient?.gender === 'Female' && param.normalRangeFemale
                  ? param.normalRangeFemale
                  : param.normalRangeGeneral || '',
                flag: 'N/A',
              }));
            } else {
              // Fallback to single result field
              initialData[test.id] = [{
                parameter: 'Result',
                value: '',
                unit: test.containerType || '',
                normalRange: '',
                flag: 'Normal',
              }];
            }
            
            initialRemarks[test.id] = '';
          }
        }

        setTests(testsDetails);
        setResultData(initialData);
        setRemarks(initialRemarks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId]);

  const handleResultChange = (testId: string, index: number, value: string) => {
    setResultData((prev) => {
      const updatedResults = [...prev[testId]];
      updatedResults[index] = {
        ...updatedResults[index],
        value: value,
        flag: calculateFlag(
          value,
          updatedResults[index].normalRange,
          updatedResults[index].parameter,
          patient?.gender || 'Male'
        ),
      };
      return {
        ...prev,
        [testId]: updatedResults,
      };
    });
  };

  const calculateFlag = (
    value: string,
    normalRange: string,
    parameter: string,
    gender: string
  ): 'Normal' | 'Low' | 'High' | 'Critical Low' | 'Critical High' | 'Critical' | 'N/A' => {
    if (!value || !normalRange) return 'N/A';

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      // Qualitative test - check if value matches normal
      return value.toLowerCase() === normalRange.toLowerCase() ? 'Normal' : 'N/A';
    }

    // Get the test code to find critical thresholds
    const test = tests.find(t => {
      const testRanges = getNormalRangesForTest(t.code);
      return testRanges?.parameters.some(p => p.parameter === parameter);
    });

    if (test) {
      const testRanges = getNormalRangesForTest(test.code);
      const paramRange = testRanges?.parameters.find(p => p.parameter === parameter);

      if (paramRange) {
        const normalMin = gender === 'Male' ? paramRange.normalMinMale : paramRange.normalMinFemale;
        const normalMax = gender === 'Male' ? paramRange.normalMaxMale : paramRange.normalMaxFemale;
        const criticalLow = gender === 'Male' ? paramRange.criticalLowMale : paramRange.criticalLowFemale;
        const criticalHigh = gender === 'Male' ? paramRange.criticalHighMale : paramRange.criticalHighFemale;

        const min = normalMin ?? paramRange.normalMinGeneral;
        const max = normalMax ?? paramRange.normalMaxGeneral;
        const critLow = criticalLow ?? paramRange.criticalLowGeneral;
        const critHigh = criticalHigh ?? paramRange.criticalHighGeneral;

        if (critLow && numericValue < critLow) return 'Critical Low';
        if (critHigh && numericValue > critHigh) return 'Critical High';
        if (min && numericValue < min) return 'Low';
        if (max && numericValue > max) return 'High';
        
        return 'Normal';
      }
    }

    return 'N/A';
  };

  const handleSubmitResults = async () => {
    if (!request || !userProfile) return;

    setSubmitting(true);

    try {
      // Create test results for each test
      for (const test of request.tests) {
        const resultValues = resultData[test.testId];
        
        // Check for abnormal and critical values
        const hasAbnormalValues = resultValues.some(rv => 
          rv.flag !== 'Normal' && rv.flag !== 'N/A'
        );
        const hasCriticalValues = resultValues.some(rv => 
          rv.flag === 'Critical' || rv.flag === 'Critical Low' || rv.flag === 'Critical High'
        );

        await firestoreService.create<TestResult>(COLLECTIONS.TEST_RESULTS, {
          testRequestId: request.id,
          testId: test.testId,
          patientId: request.patientId,
          facilityId: userProfile.facilityId,
          resultValues,
          remarks: remarks[test.testId],
          hasAbnormalValues,
          hasCriticalValues,
          datePerformed: new Date(),
          dateSubmitted: new Date(),
          performedBy: userProfile.id,
          status: 'Submitted',
        } as Partial<TestResult>);

        // Update test status in request
        await firestoreService.update(COLLECTIONS.TEST_REQUESTS, request.id, {
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

  const calculateAge = (dateOfBirth: Date) => {
    return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case 'Normal':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Critical':
      case 'Critical Low':
      case 'Critical High':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
            <Link href="/dashboard/lab-tech/results">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enter Test Results</h1>
              <p className="text-gray-600 mt-1">
                Complete testing and enter results for approval
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              patient?.urgency === 'STAT' ? 'bg-red-100 text-red-800' :
              patient?.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {patient?.urgency || 'Routine'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Patient Biodata Card */}
          <Card title="Patient Information" className="border-blue-200 bg-blue-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Patient ID</div>
                    <div className="font-semibold text-gray-900">{patient?.patientId}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Full Name</div>
                    <div className="font-semibold text-gray-900">
                      {patient?.surname}, {patient?.givenName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Date of Birth</div>
                    <div className="font-semibold text-gray-900">
                      {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Age</div>
                    <div className="font-semibold text-gray-900">
                      {patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A'} years
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Gender</div>
                    <div className="font-semibold text-gray-900">{patient?.gender}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-semibold text-gray-900">{patient?.phoneNumber}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="font-semibold text-gray-900">
                      {patient?.address.village}, {patient?.address.parish}
                    </div>
                    <div className="text-sm text-gray-600">{patient?.address.district}</div>
                  </div>
                </div>
              </div>
            </div>

            {patient?.clinicalHistory && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-700 mb-1">Clinical History:</div>
                <div className="text-sm text-gray-900">{patient.clinicalHistory}</div>
              </div>
            )}
          </Card>

          {/* Sample Collection Information */}
          {request.sampleCollectionData && (
            <Card title="Sample Collection Details" className="border-green-200 bg-green-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <Beaker className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Collection Date</div>
                    <div className="font-semibold text-gray-900">
                      {request.sampleCollectionData.collectionDate 
                        ? new Date(request.sampleCollectionData.collectionDate).toLocaleString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Collected By</div>
                    <div className="font-semibold text-gray-900">
                      {request.sampleCollectionData.collectedBy || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Quality Status</div>
                    <div className={`font-semibold ${
                      request.sampleCollectionData.overallQualityStatus === 'PASSED' ? 'text-green-700' :
                      request.sampleCollectionData.overallQualityStatus === 'PARTIAL' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {request.sampleCollectionData.overallQualityStatus || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Samples Collected */}
              {request.sampleCollectionData.samples && request.sampleCollectionData.samples.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-3">Samples Collected:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {request.sampleCollectionData.samples.map((sample, index) => (
                      <div key={index} className="flex items-center p-3 bg-white rounded-lg border">
                        <TestTube className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{getSampleTypeName(sample.sampleType)}</div>
                          <div className="text-xs text-gray-600">
                            Volume: {sample.volumeCollected || sample.volumeRequired} • Status: {sample.status}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sample.status === 'COLLECTED' ? 'bg-green-100 text-green-800' :
                          sample.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sample.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.sampleCollectionData.patientConditionNotes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-yellow-900 mb-1">Patient Condition Notes:</div>
                  <div className="text-sm text-yellow-800">{request.sampleCollectionData.patientConditionNotes}</div>
                </div>
              )}

              {request.clerkNotes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">Clerk Notes:</div>
                  <div className="text-sm text-blue-800">{request.clerkNotes}</div>
                </div>
              )}
            </Card>
          )}

          {/* Test Results Entry */}
          {tests.map((test, testIndex) => {
            const testResults = resultData[test.id] || [];
            
            return (
              <Card 
                key={test.id} 
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TestTube className="w-6 h-6 text-primary mr-3" />
                      <div>
                        <div className="text-xl font-bold">{test.name}</div>
                        <div className="text-sm font-normal text-gray-600">Code: {test.code} • TAT: {test.turnaroundTime}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Sample: {test.sampleType}
                    </div>
                  </div>
                }
                className="border-primary/20"
              >
                <div className="space-y-4">
                  {/* Parameters with Auto-Ranges */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parameter</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Result Value</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Normal Range</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((result, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{result.parameter}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={result.value}
                                onChange={(e) => handleResultChange(test.id, index, e.target.value)}
                                placeholder="Enter value"
                                className="w-32"
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-sm font-medium text-gray-700">
                                {result.unit}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Standard unit</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-700">{result.normalRange}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getFlagColor(result.flag)}`}>
                                  {result.flag === 'High' && <TrendingUp className="w-4 h-4 mr-1" />}
                                  {result.flag === 'Low' && <TrendingDown className="w-4 h-4 mr-1" />}
                                  {(result.flag === 'Critical' || result.flag === 'Critical High' || result.flag === 'Critical Low') && <AlertTriangle className="w-4 h-4 mr-1" />}
                                  {result.flag === 'Normal' && <CheckCircle className="w-4 h-4 mr-1" />}
                                  {result.flag}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks */}
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks / Observations
                    </label>
                    <textarea
                      value={remarks[test.id] || ''}
                      onChange={(e) =>
                        setRemarks({ ...remarks, [test.id]: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Add any observations, comments, or quality notes..."
                    />
                  </div>

                  {/* Quality Indicators */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {testResults.filter(r => r.flag === 'Normal').length}
                      </div>
                      <div className="text-xs text-green-600">Normal Results</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">
                        {testResults.filter(r => r.flag === 'High' || r.flag === 'Low').length}
                      </div>
                      <div className="text-xs text-orange-600">Abnormal Results</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">
                        {testResults.filter(r => r.flag.includes('Critical')).length}
                      </div>
                      <div className="text-xs text-red-600">Critical Results</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Important:</p>
              <p>• Units are standard and cannot be edited</p>
              <p>• Flags are automatically calculated based on normal ranges</p>
              <p>• Results will be sent for owner approval after submission</p>
            </div>
            <Button
              onClick={handleSubmitResults}
              isLoading={submitting}
              size="lg"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Submit All Results for Approval
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
