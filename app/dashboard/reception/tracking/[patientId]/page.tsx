'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SampleTracker from '@/components/tracking/SampleTracker';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, User, Phone, MapPin, Calendar, FileText, TestTube } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { Patient, TestRequest, TestResult } from '@/types';
import { format } from 'date-fns';

export default function PatientTrackingPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const { userProfile } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [results, setResults] = useState<{ [requestId: string]: TestResult[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const patientData = await firestoreService.getById<Patient>(
          COLLECTIONS.PATIENTS,
          patientId
        );
        setPatient(patientData);
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };

    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test requests for this patient
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('patientId', '==', patientId),
      where('facilityId', '==', userProfile.facilityId)
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        sampleReceivedDate: doc.data().sampleReceivedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestRequest[];

      setRequests(requestsData);
    });

    // Subscribe to test results
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('patientId', '==', patientId),
      where('facilityId', '==', userProfile.facilityId)
    );

    const unsubscribeResults = onSnapshot(resultsQuery, (snapshot) => {
      const resultsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        datePerformed: doc.data().datePerformed?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestResult[];

      // Group results by request ID
      const groupedResults: { [requestId: string]: TestResult[] } = {};
      resultsData.forEach((result) => {
        if (!groupedResults[result.testRequestId]) {
          groupedResults[result.testRequestId] = [];
        }
        groupedResults[result.testRequestId].push(result);
      });

      setResults(groupedResults);
      setLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeResults();
    };
  }, [patientId, userProfile?.facilityId]);

  if (loading || !patient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading patient tracking...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/reception">
              <Button size="sm" className="mr-4 bg-gray-500 hover:bg-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Tracking</h1>
              <p className="text-gray-600 mt-1">
                Complete journey tracking for {patient.surname} {patient.givenName}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Summary */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {patient.surname}, {patient.givenName}
                </h3>
                <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{format(patient.dateOfBirth, 'dd MMM yyyy')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-medium">{patient.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{patient.address.district}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Requests:</span>
                <span className="ml-2 font-semibold">{requests.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Completed Tests:</span>
                <span className="ml-2 font-semibold">
                  {Object.values(results).flat().filter(r => r.status === 'Approved').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Visit:</span>
                <span className="ml-2 font-semibold">
                  {requests.length > 0 ? format(requests[0].requestDate, 'dd MMM yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Test Requests Timeline */}
        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Test Requests Found
              </h3>
              <p className="text-gray-600">
                This patient has no test requests in the system yet.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {requests.map((request) => (
              <div key={request.id}>
                <SampleTracker
                  testRequestId={request.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card title="Quick Actions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/dashboard/reception/patients/${patient.id}/tests`}>
              <Button className="w-full flex items-center justify-center space-x-2">
                <TestTube className="w-4 h-4" />
                <span>Request New Tests</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
              onClick={() => window.print()}
            >
              <FileText className="w-4 h-4" />
              <span>Print Summary</span>
            </Button>

            <Link href={`/dashboard/reception/patients/${patient.id}`}>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>View Patient Details</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}