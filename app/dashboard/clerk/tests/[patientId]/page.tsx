'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Plus, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { Patient, Test, TestRequest } from '@/types';

export default function TestSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { userProfile } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  // const [categories, setCategories] = useState<TestCategory[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clerkNotes, setClerkNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      const patientData = await firestoreService.getById<Patient>(
        COLLECTIONS.PATIENTS,
        patientId
      );
      setPatient(patientData);
      setLoading(false);
    };

    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    // Subscribe to test categories
    const categoriesQuery = query(
      collection(db, COLLECTIONS.TEST_CATEGORIES),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(categoriesQuery, () => {
      // const categoriesData = snapshot.docs.map((doc) => ({
      //   id: doc.id,
      //   ...doc.data(),
      //   createdAt: doc.data().createdAt?.toDate() || new Date(),
      // })) as TestCategory[];

      // setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Subscribe to tests
    const testsQuery = query(
      collection(db, COLLECTIONS.TESTS),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      }) as Test[];

      setTests(testsData);
    });

    return () => unsubscribe();
  }, []);

  const addTest = (test: Test) => {
    if (!selectedTests.find((t) => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
  };

  const handleSubmit = async () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    if (!patient || !userProfile) return;

    setSubmitting(true);

    try {
      const testRequestData: Partial<TestRequest> = {
        patientId: patient.id,
        facilityId: userProfile.facilityId,
        requestDate: new Date(),
        requestedBy: userProfile.id,
        tests: selectedTests.map((test) => ({
          testId: test.id,
          status: 'Pending',
          price: test.price,
        })),
        clerkNotes,
        paymentStatus: 'Pending',
        overallStatus: 'Pending',
      };

      await firestoreService.create<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        testRequestData
      );

      alert('Test request created successfully!');
      router.push('/dashboard/clerk/samples');
    } catch (error) {
      console.error('Error creating test request:', error);
      alert('Failed to create test request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTests = tests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = selectedTests.reduce((sum, test) => sum + test.price, 0);

  if (loading || !patient) {
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
            <Link href="/dashboard/clerk/forms">
              <Button size="sm" className="mr-4 bg-gray-500 hover:bg-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Tests</h1>
              <p className="text-gray-600 mt-1">
                Patient: {patient.surname} {patient.givenName} ({patient.patientId})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Tests */}
          <Card title="Available Tests">
            <Input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary"
                >
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      {test.code} - UGX {test.price.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addTest(test)}
                    disabled={selectedTests.some((t) => t.id === test.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Selected Tests */}
          <Card title="Selected Tests">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clerk Notes
              </label>
              <textarea
                value={clerkNotes}
                onChange={(e) => setClerkNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add observations or special instructions..."
              />
            </div>

            {selectedTests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No tests selected yet
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {selectedTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{test.name}</div>
                      <div className="text-sm text-gray-600">
                        UGX {test.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTest(test.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  UGX {totalCost.toLocaleString()}
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedTests.length === 0}
                className="w-full flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Creating Request...' : 'Create Test Request'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
