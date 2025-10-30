'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Patient, TestCategory, Test, TestRequest } from '@/types';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SelectTestsPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<{ test: Test; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadData = async () => {
    try {
      // Load patient
      const patientData = await firestoreService.getById<Patient>(
        COLLECTIONS.PATIENTS,
        patientId
      );
      setPatient(patientData);

      // Load test categories
      const categoriesData = await firestoreService.getAll<TestCategory>(
        COLLECTIONS.TEST_CATEGORIES
      );
      setCategories(categoriesData);

      // Load tests
      const testsData = await firestoreService.getAll<Test>(COLLECTIONS.TESTS);
      setTests(testsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (test: Test) => {
    const index = selectedTests.findIndex((t) => t.test.id === test.id);
    if (index >= 0) {
      setSelectedTests(selectedTests.filter((t) => t.test.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, { test, price: test.price }]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (!userProfile) {
        throw new Error('User not authenticated');
      }

      const testRequestData: Partial<TestRequest> = {
        patientId,
        facilityId: userProfile.facilityId,
        requestDate: new Date(),
        requestedBy: userProfile.id,
        tests: selectedTests.map((st) => ({
          testId: st.test.id,
          status: 'Pending' as const,
          price: st.price,
        })),
        paymentStatus: 'Pending' as const,
        sampleCollectionStatus: 'PENDING' as const,
        overallStatus: 'AwaitingPayment' as const,
      };

      const requestId = await firestoreService.create<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        testRequestData
      );

      // Redirect to payment page
      router.push(`/dashboard/reception/payments/new?requestId=${requestId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create test request';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const total = selectedTests.reduce((sum, st) => sum + st.price, 0);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/reception">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Tests</h1>
              {patient && (
                <p className="text-gray-600 mt-1">
                  Patient: {patient.givenName} {patient.surname} ({patient.patientId})
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Categories */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map((category) => {
              const categoryTests = tests.filter(
                (t) => t.categoryId === category.id
              );

              return (
                <Card key={category.id} title={category.name}>
                  <div className="space-y-2">
                    {categoryTests.map((test) => {
                      const isSelected = selectedTests.some(
                        (t) => t.test.id === test.id
                      );

                      return (
                        <div
                          key={test.id}
                          className={`
                            p-4 border rounded-lg cursor-pointer transition-all
                            ${
                              isSelected
                                ? 'border-primary bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300'
                            }
                          `}
                          onClick={() => toggleTest(test)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {test.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Code: {test.code} | Turnaround:{' '}
                                    {test.turnaroundTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                UGX {test.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected Tests Summary */}
          <div>
            <Card title="Selected Tests" className="sticky top-4">
              {selectedTests.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests selected</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {selectedTests.map((st) => (
                      <div
                        key={st.test.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{st.test.name}</p>
                          <p className="text-xs text-gray-600">
                            {st.test.code}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-primary mr-2">
                            {st.price.toLocaleString()}
                          </p>
                          <button
                            onClick={() => toggleTest(st.test)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        UGX {total.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      isLoading={submitting}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
