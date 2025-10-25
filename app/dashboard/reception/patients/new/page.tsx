'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Patient } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { UGANDA_DISTRICTS } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePatientId = async (facilityCode: string): Promise<string> => {
    // Get the last patient number for this facility
    // For now, using a simple counter - in production, this should be atomic
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

      // Get facility details to generate patient ID
      const facility = await firestoreService.getById('facilities', userProfile.facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      const facilityCode = (facility as { code: string }).code;
      const patientId = await generatePatientId(facilityCode);

      // Build patient data object, only including optional fields if they have values
      const patientData: Partial<Patient> = {
        patientId,
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
        isExternalReferral: false,
        createdBy: userProfile.id,
      };

      // Add optional fields only if they have values
      if (formData.email?.trim()) {
        patientData.email = formData.email.trim();
      }
      if (formData.nationalID?.trim()) {
        patientData.nationalID = formData.nationalID.trim();
      }
      if (formData.NIN?.trim()) {
        patientData.NIN = formData.NIN.trim();
      }
      if (formData.referringDoctor?.trim()) {
        patientData.referringDoctor = formData.referringDoctor.trim();
      }
      if (formData.hospitalClinic?.trim()) {
        patientData.hospitalClinic = formData.hospitalClinic.trim();
      }
      if (formData.clinicalHistory?.trim()) {
        patientData.clinicalHistory = formData.clinicalHistory.trim();
      }
      if (formData.insuranceProvider?.trim()) {
        patientData.insuranceProvider = formData.insuranceProvider.trim();
      }
      if (formData.insuranceNumber?.trim()) {
        patientData.insuranceNumber = formData.insuranceNumber.trim();
      }
      if (formData.corporateClient?.trim()) {
        patientData.corporateClient = formData.corporateClient.trim();
      }

      const newPatientId = await firestoreService.create<Patient>(
        COLLECTIONS.PATIENTS,
        patientData
      );

      // Redirect to test request page
      router.push(`/dashboard/reception/patients/${newPatientId}/tests`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register patient';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Register New Patient</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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
              <Link href="/dashboard/reception">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={loading}>
                Register Patient & Select Tests
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
