'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Patient } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { UGANDA_DISTRICTS } from '@/lib/constants';
import { ArrowLeft, FileText, Users, Building2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function NewPatientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Select Type, Step 2: Registration Form
  const [patientType, setPatientType] = useState<'walk-in' | 'referral' | 'inpatient' | ''>('');
  
  const [formData, setFormData] = useState({
    surname: '',
    givenName: '',
    dateOfBirth: '',
    gender: 'Male',
    maritalStatus: 'Single',
    phoneNumber: '',
    email: '',
    village: '',
    parish: '',
    subCounty: '',
    district: 'Ntungamo',
    nationalID: '',
    NIN: '',
    referringDoctor: '',
    hospitalClinic: '',
    clinicalHistory: '',
    urgency: 'Routine',
    paymentType: 'Cash',
    insuranceProvider: '',
    insuranceNumber: '',
    corporateClient: '',
    // Referral patient fields
    requestFormNumber: '',
    requestingPhysician: '',
    clinicalDiagnosis: '',
    requestedTests: '',
    // Inpatient fields
    sourceFacilityId: '',
    transferNotes: '',
  });

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'walk-in' || typeParam === 'referral' || typeParam === 'inpatient') {
      setPatientType(typeParam);
      setStep(2);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePatientTypeSelect = (type: 'walk-in' | 'referral' | 'inpatient') => {
    setPatientType(type);
    setStep(2);
  };

  const generatePatientId = async (facilityCode: string): Promise<string> => {
    const timestamp = Date.now().toString().slice(-5);
    return `${facilityCode}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!userProfile?.facilityId) {
        throw new Error('No facility associated with user');
      }

      const facility = await firestoreService.getById('facilities', userProfile.facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      const facilityCode = (facility as { code: string }).code;
      const patientId = await generatePatientId(facilityCode);

      const patientData: Partial<Patient> = {
        patientId,
        patientType,
        facilityId: userProfile.facilityId,
        registrationDate: new Date(),
        surname: formData.surname,
        givenName: formData.givenName,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender as 'Male' | 'Female',
        maritalStatus: formData.maritalStatus as 'Single' | 'Married' | 'Divorced' | 'Widowed',
        phoneNumber: formData.phoneNumber,
        address: {
          village: formData.village,
          parish: formData.parish,
          subCounty: formData.subCounty,
          district: formData.district,
        },
        urgency: formData.urgency as 'Routine' | 'Urgent' | 'STAT',
        paymentType: formData.paymentType as 'Cash' | 'Insurance' | 'Corporate',
        isExternalReferral: patientType === 'referral',
        requiresClerkRequest: patientType === 'walk-in',
        createdBy: userProfile.id,
      };

      // Add optional fields
      if (formData.email?.trim()) patientData.email = formData.email.trim();
      if (formData.nationalID?.trim()) patientData.nationalID = formData.nationalID.trim();
      if (formData.NIN?.trim()) patientData.NIN = formData.NIN.trim();
      if (formData.referringDoctor?.trim()) patientData.referringDoctor = formData.referringDoctor.trim();
      if (formData.hospitalClinic?.trim()) patientData.hospitalClinic = formData.hospitalClinic.trim();
      if (formData.clinicalHistory?.trim()) patientData.clinicalHistory = formData.clinicalHistory.trim();
      if (formData.insuranceProvider?.trim()) patientData.insuranceProvider = formData.insuranceProvider.trim();
      if (formData.insuranceNumber?.trim()) patientData.insuranceNumber = formData.insuranceNumber.trim();
      if (formData.corporateClient?.trim()) patientData.corporateClient = formData.corporateClient.trim();

      // Referral patient specific fields
      if (patientType === 'referral') {
        if (formData.requestFormNumber?.trim()) {
          (patientData as any).requestFormNumber = formData.requestFormNumber.trim();
        }
        if (formData.requestingPhysician?.trim()) {
          (patientData as any).requestingPhysician = formData.requestingPhysician.trim();
        }
        if (formData.clinicalDiagnosis?.trim()) {
          (patientData as any).clinicalDiagnosis = formData.clinicalDiagnosis.trim();
        }
        if (formData.requestedTests?.trim()) {
          (patientData as any).requestedTests = formData.requestedTests.trim();
        }
      }

      // Inpatient specific fields
      if (patientType === 'inpatient') {
        if (formData.sourceFacilityId?.trim()) {
          (patientData as any).originFacilityId = formData.sourceFacilityId.trim();
        }
        if (formData.transferNotes?.trim()) {
          (patientData as any).referralReason = formData.transferNotes.trim();
        }
      }

      const newPatientId = await firestoreService.create<Patient>(
        COLLECTIONS.PATIENTS,
        patientData
      );

      // Route based on patient type
      if (patientType === 'walk-in') {
        // Walk-in: Send to clerk for consultation
        alert(`✅ Walk-in patient registered!\n\nPatient ID: ${patientId}\n\n📋 Next Step: Direct patient to CLERK for clinical assessment and lab request creation.`);
        router.push('/dashboard/reception');
      } else if (patientType === 'referral') {
        // Referral: Go to test selection then payment
        router.push(`/dashboard/reception/patients/${newPatientId}/tests?type=referral`);
      } else if (patientType === 'inpatient') {
        // Inpatient: Go to lab request (tests pre-determined)
        router.push(`/dashboard/reception/patients/${newPatientId}/lab-request`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register patient';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Patient Type Selection
  if (step === 1) {
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
                <h1 className="text-3xl font-bold text-gray-900">Register New Patient</h1>
                <p className="text-gray-600 mt-1">Select patient category to begin registration</p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of patient is this?</h2>
                <p className="text-gray-600">Select the appropriate category to continue with registration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Walk-in Patient */}
                <button
                  onClick={() => handlePatientTypeSelect('walk-in')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Walk-in Patient</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      No prior consultation or lab request form
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-medium text-gray-700">Workflow:</p>
                      <p>1. Register patient</p>
                      <p>2. Send to CLERK for consultation</p>
                      <p>3. Return for payment</p>
                      <p>4. Sample collection by clerk</p>
                      <p>5. Lab processing</p>
                    </div>
                  </div>
                </button>

                {/* Referral Patient */}
                <button
                  onClick={() => handlePatientTypeSelect('referral')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Patient</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Has external lab request form from doctor
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-medium text-gray-700">Workflow:</p>
                      <p>1. Register with form details</p>
                      <p>2. Select tests from form</p>
                      <p>3. Process payment IMMEDIATELY</p>
                      <p>4. Sample collection by clerk</p>
                      <p>5. Lab processing</p>
                    </div>
                  </div>
                </button>

                {/* Inpatient */}
                <button
                  onClick={() => handlePatientTypeSelect('inpatient')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-secondary hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <Building2 className="w-8 h-8 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Inpatient Transfer</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      From our facility network
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-medium text-gray-700">Workflow:</p>
                      <p>1. Verify facility ID</p>
                      <p>2. System loads patient data</p>
                      <p>3. Process payment IMMEDIATELY</p>
                      <p>4. Sample collection by clerk</p>
                      <p>5. Lab processing</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Important: Sample Collection</p>
                    <p className="text-blue-800">
                      All patient types require sample collection by the clerk AFTER payment is confirmed. 
                      The clerk will perform quality checks and ensure proper sample handling before sending to the lab.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Step 2: Registration Form (existing form code)
  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="mr-4" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Type Selection
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Register New Patient</h1>
              <div className="flex items-center mt-2">
                {patientType === 'referral' ? (
                  <>
                    <FileText className="w-5 h-5 text-primary mr-2" />
                    <span className="text-sm font-medium text-primary">Referral Patient: Has lab request form from doctor</span>
                  </>
                ) : patientType === 'walk-in' ? (
                  <>
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-600">Walk-in Patient: Needs clerk assessment first</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 text-secondary mr-2" />
                    <span className="text-sm font-medium text-secondary">Inpatient: From facility network</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Referral Patient: Lab Request Form Information */}
            {patientType === 'referral' && (
              <Card title="External Lab Request Form Information" className="border-primary/20 bg-primary/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Request Form Number"
                    name="requestFormNumber"
                    value={formData.requestFormNumber}
                    onChange={handleChange}
                    placeholder="e.g., REQ-2024-001"
                    required
                  />
                  <Input
                    label="Requesting Physician"
                    name="requestingPhysician"
                    value={formData.requestingPhysician}
                    onChange={handleChange}
                    placeholder="Dr. Name"
                    required
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinical Diagnosis
                    </label>
                    <textarea
                      name="clinicalDiagnosis"
                      value={formData.clinicalDiagnosis}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Primary diagnosis from referring physician"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requested Tests (from form)
                    </label>
                    <textarea
                      name="requestedTests"
                      value={formData.requestedTests}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Tests requested by physician"
                      required
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Inpatient: Facility Transfer Information */}
            {patientType === 'inpatient' && (
              <Card title="Facility Transfer Information" className="border-secondary/20 bg-secondary/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Source Facility ID"
                    name="sourceFacilityId"
                    value={formData.sourceFacilityId}
                    onChange={handleChange}
                    placeholder="Facility code or ID"
                    required
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Notes
                    </label>
                    <textarea
                      name="transferNotes"
                      value={formData.transferNotes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                      placeholder="Reason for transfer, pre-determined tests, etc."
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Personal Information */}
            <Card title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Surname / Family Name"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Given Name / First Name"
                  name="givenName"
                  value={formData.givenName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                  ]}
                  required
                />
                <Select
                  label="Marital Status"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  options={[
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' },
                  ]}
                />
              </div>
            </Card>

            {/* Contact Information */}
            <Card title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+256 700 000 000"
                  required
                />
                <Input
                  label="Email Address (Optional)"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </Card>

            {/* Address */}
            <Card title="Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Village"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Parish"
                  name="parish"
                  value={formData.parish}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Sub-County"
                  name="subCounty"
                  value={formData.subCounty}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  options={UGANDA_DISTRICTS.map(d => ({ value: d, label: d }))}
                  required
                />
              </div>
            </Card>

            {/* Identification */}
            <Card title="Identification (Optional)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="National ID"
                  name="nationalID"
                  value={formData.nationalID}
                  onChange={handleChange}
                />
                <Input
                  label="NIN (National Identification Number)"
                  name="NIN"
                  value={formData.NIN}
                  onChange={handleChange}
                />
              </div>
            </Card>

            {/* Medical Information */}
            <Card title="Medical Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Referring Doctor"
                  name="referringDoctor"
                  value={formData.referringDoctor}
                  onChange={handleChange}
                />
                <Input
                  label="Hospital / Clinic"
                  name="hospitalClinic"
                  value={formData.hospitalClinic}
                  onChange={handleChange}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinical History
                  </label>
                  <textarea
                    name="clinicalHistory"
                    value={formData.clinicalHistory}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <Select
                  label="Urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  options={[
                    { value: 'Routine', label: 'Routine' },
                    { value: 'Urgent', label: 'Urgent' },
                    { value: 'STAT', label: 'STAT (Immediate)' },
                  ]}
                  required
                />
              </div>
            </Card>

            {/* Payment Information */}
            <Card title="Payment Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Payment Type"
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Insurance', label: 'Insurance' },
                    { value: 'Corporate', label: 'Corporate' },
                  ]}
                  required
                />
                {formData.paymentType === 'Insurance' && (
                  <>
                    <Input
                      label="Insurance Provider"
                      name="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Insurance Number"
                      name="insuranceNumber"
                      value={formData.insuranceNumber}
                      onChange={handleChange}
                      required
                    />
                  </>
                )}
                {formData.paymentType === 'Corporate' && (
                  <Input
                    label="Corporate Client"
                    name="corporateClient"
                    value={formData.corporateClient}
                    onChange={handleChange}
                    required
                  />
                )}
              </div>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                {patientType === 'walk-in' 
                  ? 'Register & Send to Clerk' 
                  : patientType === 'referral'
                  ? 'Register & Select Tests'
                  : 'Register & Process Payment'
                }
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function NewPatientPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <NewPatientPageContent />
    </Suspense>
  );
}
