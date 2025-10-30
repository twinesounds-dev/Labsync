'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Patient, Test, TestCategory, TestRequest } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Users, FileText, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function WalkInPatientsPage() {
  const { userProfile } = useAuth();
  const [walkInPatients, setWalkInPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<{ test: Test; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [labRequestData, setLabRequestData] = useState({
    clinicalHistory: '',
    clinicalDiagnosis: '',
    requestingPhysician: '',
    specialInstructions: '',
  });

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to walk-in patients
    const patientsQuery = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('facilityId', '==', userProfile.facilityId),
      where('requiresClerkRequest', '==', true)
    );

    const unsubscribe = onSnapshot(patientsQuery, async (snapshot) => {
      const patientsData: Patient[] = [];
      
      for (const doc of snapshot.docs) {
        const patient = { id: doc.id, ...doc.data() } as Patient;
        
        // Check if patient already has a test request
        const requests = await firestoreService.getAll<TestRequest>(COLLECTIONS.TEST_REQUESTS);
        const hasRequest = requests.some((req) => req.patientId === patient.id);
        
        if (!hasRequest) {
          patientsData.push(patient);
        }
      }
      
      setWalkInPatients(patientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const [categoriesData, testsData] = await Promise.all([
        firestoreService.getAll<TestCategory>(COLLECTIONS.TEST_CATEGORIES),
        firestoreService.getAll<Test>(COLLECTIONS.TESTS),
      ]);
      setCategories(categoriesData);
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
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

  const handleCreateLabRequest = async () => {
    if (!selectedPatient || !userProfile) {
      alert('Please select a patient');
      return;
    }

    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    if (!labRequestData.clinicalHistory || !labRequestData.clinicalDiagnosis) {
      alert('Please enter clinical history and diagnosis');
      return;
    }

    setSubmitting(true);

    try {
      // Create test request
      const testRequestData: Partial<TestRequest> = {
        patientId: selectedPatient.id,
        facilityId: userProfile.facilityId,
        requestDate: new Date(),
        requestedBy: userProfile.id,
        tests: selectedTests.map((st) => ({
          testId: st.test.id,
          status: 'Pending' as const,
          price: st.price,
        })),
        clerkNotes: `Lab request created by clerk.\nClinical History: ${labRequestData.clinicalHistory}\nDiagnosis: ${labRequestData.clinicalDiagnosis}\nPhysician: ${labRequestData.requestingPhysician || 'N/A'}\nInstructions: ${labRequestData.specialInstructions || 'None'}`,
        paymentStatus: 'Pending' as const,
        sampleCollectionStatus: 'PENDING' as const,
        overallStatus: 'AwaitingPayment' as const,
      };

      await firestoreService.create<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        testRequestData
      );

      // Update patient to remove requiresClerkRequest flag
      await firestoreService.update(COLLECTIONS.PATIENTS, selectedPatient.id, {
        requiresClerkRequest: false,
        updatedAt: new Date(),
      });

      alert('Lab request created successfully! Patient can proceed to reception for payment.');
      
      // Reset form
      setSelectedPatient(null);
      setSelectedTests([]);
      setLabRequestData({
        clinicalHistory: '',
        clinicalDiagnosis: '',
        requestingPhysician: '',
        specialInstructions: '',
      });
    } catch (error) {
      console.error('Error creating lab request:', error);
      alert('Failed to create lab request');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAge = (dateOfBirth: Date) => {
    return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading walk-in patients...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Walk-in Patients</h1>
            <p className="text-gray-600 mt-1">Create lab requests for walk-in patients</p>
          </div>
          <Link href="/dashboard/clerk">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {walkInPatients.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No walk-in patients waiting for lab request</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient List */}
            <div>
              <Card title="Walk-in Patients" subtitle={`${walkInPatients.length} patients waiting`}>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {walkInPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.patientId}</h3>
                          <p className="text-sm text-gray-600">
                            {patient.surname}, {patient.givenName}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500">
                        {patient.gender} | Age: {calculateAge(patient.dateOfBirth)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Lab Request Form */}
            <div className="lg:col-span-2">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <Card title="Patient Information">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedPatient.surname}, {selectedPatient.givenName}
                      </div>
                      <div>
                        <span className="font-medium">Patient ID:</span> {selectedPatient.patientId}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {selectedPatient.gender}
                      </div>
                      <div>
                        <span className="font-medium">Age:</span> {calculateAge(selectedPatient.dateOfBirth)} years
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {selectedPatient.phoneNumber}
                      </div>
                      <div>
                        <span className="font-medium">Payment:</span> {selectedPatient.paymentType}
                      </div>
                    </div>
                  </Card>

                  {/* Clinical Assessment */}
                  <Card title="Clinical Assessment">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clinical History <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={labRequestData.clinicalHistory}
                          onChange={(e) => setLabRequestData({ ...labRequestData, clinicalHistory: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Patient's medical history and presenting complaints..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clinical Diagnosis <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={labRequestData.clinicalDiagnosis}
                          onChange={(e) => setLabRequestData({ ...labRequestData, clinicalDiagnosis: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Preliminary or suspected diagnosis..."
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Requesting Physician"
                          value={labRequestData.requestingPhysician}
                          onChange={(e) => setLabRequestData({ ...labRequestData, requestingPhysician: e.target.value })}
                          placeholder="Dr. Name (optional)"
                        />
                        <Input
                          label="Special Instructions"
                          value={labRequestData.specialInstructions}
                          onChange={(e) => setLabRequestData({ ...labRequestData, specialInstructions: e.target.value })}
                          placeholder="Any special notes (optional)"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Test Selection */}
                  <Card title="Select Tests">
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const categoryTests = tests.filter((t) => t.categoryId === category.id);
                        if (categoryTests.length === 0) return null;

                        return (
                          <div key={category.id}>
                            <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
                            <div className="space-y-2">
                              {categoryTests.map((test) => {
                                const isSelected = selectedTests.some((t) => t.test.id === test.id);
                                return (
                                  <div
                                    key={test.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => toggleTest(test)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="mr-3 h-4 w-4"
                                        />
                                        <div>
                                          <p className="font-medium text-sm">{test.name}</p>
                                          <p className="text-xs text-gray-600">{test.code}</p>
                                        </div>
                                      </div>
                                      <p className="text-sm font-semibold text-primary">
                                        UGX {test.price.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Summary & Submit */}
                  {selectedTests.length > 0 && (
                    <Card title="Summary">
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Tests:</p>
                          {selectedTests.map((st) => (
                            <div key={st.test.id} className="flex justify-between text-sm mb-1">
                              <span>{st.test.name}</span>
                              <span className="font-semibold">UGX {st.price.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-primary">
                              UGX {selectedTests.reduce((sum, st) => sum + st.price, 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateLabRequest}
                          isLoading={submitting}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Create Lab Request & Send to Reception
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Patient will be sent to reception for payment confirmation
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a patient to create lab request</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
