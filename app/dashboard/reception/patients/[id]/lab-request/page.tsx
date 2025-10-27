'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Patient } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { TEST_CATEGORIES } from '@/lib/constants';
import { ArrowLeft, FileText, Printer, Save } from 'lucide-react';
import Link from 'next/link';

interface LabRequestForm {
  patientId: string;
  requestNumber: string;
  requestDate: Date;
  clinicalHistory: string;
  clinicalDiagnosis: string;
  requestingPhysician: string;
  selectedTests: string[];
  urgency: 'Routine' | 'Urgent' | 'STAT';
  specialInstructions: string;
}

export default function LabRequestPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  
  const [formData, setFormData] = useState<LabRequestForm>({
    patientId: params.id as string,
    requestNumber: '',
    requestDate: new Date(),
    clinicalHistory: '',
    clinicalDiagnosis: '',
    requestingPhysician: '',
    selectedTests: [],
    urgency: 'Routine',
    specialInstructions: '',
  });

  useEffect(() => {
    loadPatient();
    generateRequestNumber();
  }, [params.id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patientData = await firestoreService.getById<Patient>(
        COLLECTIONS.PATIENTS,
        params.id as string
      );
      if (patientData) {
        setPatient(patientData);
      }
    } catch (err) {
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const generateRequestNumber = async () => {
    try {
      if (!userProfile?.facilityId) return;
      
      const facility = await firestoreService.getById('facilities', userProfile.facilityId);
      if (facility) {
        const facilityCode = (facility as { code: string }).code;
        const timestamp = Date.now().toString().slice(-6);
        const requestNumber = `${facilityCode}-REQ-${timestamp}`;
        setFormData(prev => ({ ...prev, requestNumber }));
      }
    } catch (err) {
      console.error('Failed to generate request number:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTestSelection = (testCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedTests: checked 
        ? [...prev.selectedTests, testCode]
        : prev.selectedTests.filter(t => t !== testCode)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Save lab request form data to patient record
      await firestoreService.update(COLLECTIONS.PATIENTS, params.id as string, {
        labRequestForm: formData,
        updatedAt: new Date(),
      });

      // Show success message
      alert('Lab request form saved successfully!');
    } catch (err) {
      setError('Failed to save lab request form');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleProceedToTests = () => {
    router.push(`/dashboard/reception/patients/${params.id}/tests?from=lab-request`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading patient data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Patient not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/reception">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laboratory Request Form</h1>
              <p className="text-sm text-gray-600 mt-1">
                Generate lab request for inpatient: {patient.surname}, {patient.givenName}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleSave} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Lab Request Form */}
        <div className="bg-white border rounded-lg p-8 mb-6 print:shadow-none print:border-none">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-900">LABORATORY REQUEST FORM</h2>
            <p className="text-sm text-gray-600 mt-2">
              {userProfile?.facility?.name || 'Medical Laboratory'}
            </p>
            <p className="text-xs text-gray-500">
              {userProfile?.facility?.address} | {userProfile?.facility?.phone}
            </p>
          </div>

          {/* Request Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Number
              </label>
              <Input
                name="requestNumber"
                value={formData.requestNumber}
                onChange={handleChange}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Date
              </label>
              <Input
                type="date"
                name="requestDate"
                value={formData.requestDate.toISOString().split('T')[0]}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Patient Information */}
          <Card title="Patient Information" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID
                </label>
                <div className="text-sm text-gray-900 font-mono">{patient.patientId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="text-sm text-gray-900">{patient.surname}, {patient.givenName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="text-sm text-gray-900">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="text-sm text-gray-900">{patient.gender}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="text-sm text-gray-900">{patient.phoneNumber}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="text-sm text-gray-900">
                  {patient.address.village}, {patient.address.parish}, {patient.address.district}
                </div>
              </div>
            </div>
          </Card>

          {/* Clinical Information */}
          <Card title="Clinical Information" className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requesting Physician
                </label>
                <Input
                  name="requestingPhysician"
                  value={formData.requestingPhysician}
                  onChange={handleChange}
                  placeholder="Dr. Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical History
                </label>
                <textarea
                  name="clinicalHistory"
                  value={formData.clinicalHistory}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Patient's clinical history and symptoms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical Diagnosis
                </label>
                <textarea
                  name="clinicalDiagnosis"
                  value={formData.clinicalDiagnosis}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Provisional or working diagnosis"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <Input
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    placeholder="Any special handling instructions"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Test Selection */}
          <Card title="Requested Tests" className="mb-6">
            <div className="space-y-6">
              {TEST_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h4 className="font-semibold text-gray-900 mb-3">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.tests.map((test) => (
                      <label key={test.code} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.selectedTests.includes(test.code)}
                          onChange={(e) => handleTestSelection(test.code, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-900">
                          {test.name} ({test.code}) - UGX {test.price.toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requesting Physician Signature
              </label>
              <div className="border-b border-gray-300 h-12"></div>
              <p className="text-xs text-gray-500 mt-1">Date: ___________</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receptionist Signature
              </label>
              <div className="border-b border-gray-300 h-12"></div>
              <p className="text-xs text-gray-500 mt-1">
                {userProfile?.firstName} {userProfile?.lastName} | Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 print:hidden">
          <Link href="/dashboard/reception">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleProceedToTests} className="bg-primary">
            <FileText className="w-4 h-4 mr-2" />
            Proceed to Test Selection
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}