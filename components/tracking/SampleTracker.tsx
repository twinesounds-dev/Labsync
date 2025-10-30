'use client';

import { useState, useEffect } from 'react';
import { TestRequest, Patient, Test, User } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { 
  CheckCircle, 
  AlertTriangle, 
  User as UserIcon,
  Calendar,
  TestTube,
  FileText,
  Printer,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface SampleTrackerProps {
  patientId?: string;
  testRequestId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: Date;
  user?: User;
  icon: React.ReactNode;
}

export default function SampleTracker({ 
  patientId, 
  testRequestId, 
  showHeader = true,
  compact = false 
}: SampleTrackerProps) {
  const [testRequest, setTestRequest] = useState<TestRequest | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);

  useEffect(() => {
    const loadTestRequest = async () => {
      try {
        setLoading(true);
        const request = await firestoreService.getById<TestRequest>(
          COLLECTIONS.TEST_REQUESTS,
          testRequestId!
        );
        
        if (request) {
          setTestRequest(request);
          await loadRelatedData(request);
        }
      } catch (error) {
        console.error('Error loading test request:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadPatientLatestRequest = async () => {
      try {
        setLoading(true);
        // This would need a proper query in a real implementation
        // For now, we'll simulate loading the latest request for a patient
        const requests = await firestoreService.getAll<TestRequest>(COLLECTIONS.TEST_REQUESTS);
        const patientRequests = requests.filter(r => r.patientId === patientId);
        const latestRequest = patientRequests.sort((a, b) => 
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
        )[0];

        if (latestRequest) {
          setTestRequest(latestRequest);
          await loadRelatedData(latestRequest);
        }
      } catch (error) {
        console.error('Error loading patient requests:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadData = async () => {
      if (testRequestId) {
        await loadTestRequest();
      } else if (patientId) {
        await loadPatientLatestRequest();
      }
    };
    loadData();
  }, [testRequestId, patientId]);

  useEffect(() => {
    const generateTrackingSteps = () => {
      if (!testRequest) return;

      const steps: TrackingStep[] = [
        {
          id: 'registration',
          title: 'Patient Registration',
          description: patient?.isExternalReferral 
            ? 'Patient registered with lab request form'
            : 'Inpatient registered and lab request generated',
          status: 'completed',
          timestamp: new Date(testRequest.requestDate),
          icon: <UserIcon className="w-5 h-5" />,
        },
        {
          id: 'test-selection',
          title: 'Test Selection & Billing',
          description: `${testRequest.tests?.length || 0} tests selected and billed`,
          status: 'completed',
          timestamp: new Date(testRequest.requestDate),
          icon: <FileText className="w-5 h-5" />,
        },
        {
          id: 'payment',
          title: 'Payment Confirmation',
          description: `Payment ${testRequest.paymentStatus.toLowerCase()}`,
          status: testRequest.paymentStatus === 'Paid' ? 'completed' : 
                 testRequest.paymentStatus === 'Partial' ? 'current' : 'pending',
          icon: <CheckCircle className="w-5 h-5" />,
        },
        {
          id: 'sample-collection',
          title: 'Sample Collection',
          description: testRequest.sampleCollectionDate 
            ? 'Sample collected and quality checked'
            : 'Awaiting sample collection',
          status: testRequest.sampleCollectionDate ? 'completed' : 
                 testRequest.paymentStatus === 'Paid' ? 'current' : 'pending',
          timestamp: testRequest.sampleCollectionDate ? new Date(testRequest.sampleCollectionDate) : undefined,
          icon: <TestTube className="w-5 h-5" />,
        },
        {
          id: 'lab-processing',
          title: 'Laboratory Processing',
          description: testRequest.overallStatus === 'InProgress' 
            ? 'Tests in progress'
            : testRequest.overallStatus === 'Completed'
            ? 'Tests completed'
            : 'Awaiting laboratory processing',
          status: testRequest.overallStatus === 'Completed' ? 'completed' :
                 testRequest.overallStatus === 'InProgress' ? 'current' :
                 testRequest.overallStatus === 'SampleCollected' || testRequest.overallStatus === 'InLab' ? 'current' : 'pending',
          icon: <AlertTriangle className="w-5 h-5" />,
        },
        {
          id: 'results-approval',
          title: 'Results Approval',
          description: testRequest.overallStatus === 'Approved' 
            ? 'Results reviewed and approved'
            : 'Awaiting results approval',
          status: testRequest.overallStatus === 'Approved' ? 'completed' :
                 testRequest.overallStatus === 'Completed' ? 'current' : 'pending',
          icon: <CheckCircle className="w-5 h-5" />,
        },
        {
          id: 'report-generation',
          title: 'Report Ready',
          description: testRequest.overallStatus === 'Approved' 
            ? 'Report ready for collection'
            : 'Report generation pending',
          status: testRequest.overallStatus === 'Approved' ? 'completed' : 'pending',
          icon: <Printer className="w-5 h-5" />,
        },
      ];

      setTrackingSteps(steps);
    };

    const generateSteps = () => {
      if (testRequest) {
        generateTrackingSteps();
      }
    };
    generateSteps();
  }, [testRequest, patient, tests]);


  const loadRelatedData = async (request: TestRequest) => {
    try {
      // Load patient data
      if (request.patientId) {
        const patientData = await firestoreService.getById<Patient>(
          COLLECTIONS.PATIENTS,
          request.patientId
        );
        setPatient(patientData);
      }

      // Load test details
      if (request.tests) {
        const testDetails = [];
        for (const testItem of request.tests) {
          const test = await firestoreService.getById<Test>(
            COLLECTIONS.TESTS,
            testItem.testId
          );
          if (test) {
            testDetails.push(test);
          }
        }
        setTests(testDetails);
      }
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };


  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStepIconColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading tracking information...</div>
      </div>
    );
  }

  if (!testRequest || !patient) {
    return (
      <div className="text-center py-8">
        <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No tracking information available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white ${compact ? 'p-4' : 'p-6'} rounded-lg border`}>
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sample Tracking</h3>
              <p className="text-sm text-gray-600">
                Patient: {patient.surname}, {patient.givenName} ({patient.patientId})
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href={`/dashboard/reception/tracking/${patient.id}`}>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <Eye className="w-4 h-4 inline mr-1" />
                  View Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="space-y-4">
        {trackingSteps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Step Icon */}
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepIconColor(step.status)}`}>
                {step.icon}
              </div>
              {index < trackingSteps.length - 1 && (
                <div className={`w-0.5 h-8 mt-2 mx-auto ${
                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-900' :
                    step.status === 'current' ? 'text-blue-900' :
                    'text-gray-600'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(step.status)}`}>
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'current' ? 'In Progress' :
                     'Pending'}
                  </span>
                </div>
              </div>
              {step.timestamp && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(step.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Information */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Request Date:</span>
              <p className="text-gray-600">{formatDate(testRequest.requestDate)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tests Requested:</span>
              <p className="text-gray-600">{tests.length} tests</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Current Status:</span>
              <p className={`font-medium ${
                testRequest.overallStatus === 'Approved' ? 'text-green-600' :
                testRequest.overallStatus === 'Completed' ? 'text-blue-600' :
                testRequest.overallStatus === 'InProgress' ? 'text-purple-600' :
                testRequest.overallStatus === 'SampleReceived' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {testRequest.overallStatus}
              </p>
            </div>
          </div>

          {tests.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 text-sm">Tests:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {tests.map((test, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {test.name} ({test.code})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}