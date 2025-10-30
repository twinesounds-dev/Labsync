'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { TestRequest, Patient, Test } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { 
  TestTube, 
  Search, 
  User,
  Calendar,
  FileText,
  Save,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SampleCollectionData {
  sampleCollectionDate: Date;
  sampleReceivedBy: string;
  clerkNotes: string;
  sampleQualityNotes: string;
  sampleQuality: 'Good' | 'Acceptable' | 'Poor' | 'Rejected';
  containerType: string;
  sampleVolume: string;
  storageConditions: string;
}

interface PendingSample extends Omit<TestRequest, 'tests'> {
  patient?: Patient;
  tests?: Test[];
}

export default function SampleCollectionPage() {
  const { userProfile } = useAuth();
  const [pendingSamples, setPendingSamples] = useState<PendingSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSample, setSelectedSample] = useState<PendingSample | null>(null);
  const [collectionData, setCollectionData] = useState<SampleCollectionData>({
    sampleCollectionDate: new Date(),
    sampleReceivedBy: userProfile?.id || '',
    clerkNotes: '',
    sampleQualityNotes: '',
    sampleQuality: 'Good',
    containerType: '',
    sampleVolume: '',
    storageConditions: 'Room Temperature',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test requests that are paid but samples not yet collected
    // Simplified query to avoid composite index requirement
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const samplesData: PendingSample[] = [];

      for (const doc of snapshot.docs) {
        const requestData = { id: doc.id, ...doc.data() } as PendingSample;

        // Filter: Only include if sample not yet received
        if (requestData.sampleReceivedDate) {
          continue; // Skip already collected samples
        }

        // Load patient data
        if (requestData.patientId) {
          try {
            const patient = await firestoreService.getById<Patient>(
              COLLECTIONS.PATIENTS,
              requestData.patientId
            );
            requestData.patient = patient || undefined;
          } catch (error) {
            console.error('Error loading patient:', error);
          }
        }

        // Load test details
        const originalTests = (requestData as unknown as TestRequest).tests;
        if (originalTests) {
          const testDetails = [];
          for (const testItem of originalTests) {
            try {
              const test = await firestoreService.getById<Test>(
                COLLECTIONS.TESTS,
                testItem.testId
              );
              if (test) {
                testDetails.push(test);
              }
            } catch (error) {
              console.error('Error loading test:', error);
            }
          }
          requestData.tests = testDetails;
        }

        samplesData.push(requestData);
      }

      // Sort by request date in memory (oldest first)
      samplesData.sort((a, b) => {
        const dateA = a.requestDate instanceof Date ? a.requestDate.getTime() : new Date(a.requestDate).getTime();
        const dateB = b.requestDate instanceof Date ? b.requestDate.getTime() : new Date(b.requestDate).getTime();
        return dateA - dateB;
      });

      setPendingSamples(samplesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const filteredSamples = pendingSamples.filter(sample => 
    !searchTerm || 
    sample.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSampleCollection = async () => {
    if (!selectedSample || !userProfile) return;

    try {
      setSaving(true);

      // Update test request with sample collection data
      await firestoreService.update(COLLECTIONS.TEST_REQUESTS, selectedSample.id, {
        sampleCollectionDate: collectionData.sampleCollectionDate,
        sampleReceivedDate: collectionData.sampleCollectionDate,
        sampleReceivedBy: userProfile.id,
        clerkNotes: collectionData.clerkNotes,
        sampleQualityNotes: collectionData.sampleQualityNotes,
        sampleCollectionData: {
          sampleQuality: collectionData.sampleQuality,
          containerType: collectionData.containerType,
          sampleVolume: collectionData.sampleVolume,
          storageConditions: collectionData.storageConditions,
        },
        overallStatus: collectionData.sampleQuality === 'Rejected' ? 'Pending' : 'SampleReceived',
        updatedAt: new Date(),
      });

      // Reset form
      setSelectedSample(null);
      setCollectionData({
        sampleCollectionDate: new Date(),
        sampleReceivedBy: userProfile.id,
        clerkNotes: '',
        sampleQualityNotes: '',
        sampleQuality: 'Good',
        containerType: '',
        sampleVolume: '',
        storageConditions: 'Room Temperature',
      });

      alert('Sample collection recorded successfully!');
    } catch (error) {
      console.error('Error recording sample collection:', error);
      alert('Failed to record sample collection');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pending samples...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample Collection</h1>
            <p className="text-gray-600 mt-1">Collect and process patient samples for testing</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/dashboard/clerk/samples">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View All Samples
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Samples List */}
          <Card title="Pending Sample Collection" subtitle={`${filteredSamples.length} samples awaiting collection`}>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by patient ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredSamples.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No samples pending collection</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSamples.map((sample) => (
                  <div 
                    key={sample.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSample?.id === sample.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSample(sample)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TestTube className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {sample.patient?.patientId}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {sample.patient?.surname}, {sample.patient?.givenName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(sample.requestDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>Age: {sample.patient ? Math.floor((Date.now() - new Date(sample.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        <span>{sample.tests?.length || 0} tests</span>
                      </div>
                    </div>

                    {sample.tests && sample.tests.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {sample.tests.slice(0, 3).map((test, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              {test.code}
                            </span>
                          ))}
                          {sample.tests.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              +{sample.tests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sample Collection Form */}
          <Card title="Sample Collection Details" subtitle={selectedSample ? `Patient: ${selectedSample.patient?.patientId}` : 'Select a sample to collect'}>
            {selectedSample ? (
              <div className="space-y-4">
                {/* Patient Info Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedSample.patient?.surname}, {selectedSample.patient?.givenName}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {selectedSample.patient?.gender}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span> {selectedSample.patient ? Math.floor((Date.now() - new Date(selectedSample.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> 
                      <span className={`ml-1 ${
                        selectedSample.patient?.urgency === 'STAT' ? 'text-red-600 font-semibold' :
                        selectedSample.patient?.urgency === 'Urgent' ? 'text-orange-600 font-medium' :
                        'text-gray-600'
                      }`}>
                        {selectedSample.patient?.urgency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tests Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Requested Tests</h4>
                  <div className="space-y-2">
                    {selectedSample.tests?.map((test, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{test.name} ({test.code})</span>
                        <span className="text-gray-600">{test.sampleType}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Collection Date & Time"
                      type="datetime-local"
                      value={collectionData.sampleCollectionDate.toISOString().slice(0, 16)}
                      onChange={(e) => setCollectionData({
                        ...collectionData,
                        sampleCollectionDate: new Date(e.target.value)
                      })}
                      required
                    />
                    <Select
                      label="Sample Quality"
                      value={collectionData.sampleQuality}
                      onChange={(e) => setCollectionData({
                        ...collectionData,
                        sampleQuality: e.target.value as 'Good' | 'Acceptable' | 'Poor' | 'Rejected'
                      })}
                      options={[
                        { value: 'Good', label: 'Good' },
                        { value: 'Acceptable', label: 'Acceptable' },
                        { value: 'Poor', label: 'Poor' },
                        { value: 'Rejected', label: 'Rejected' },
                      ]}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Container Type"
                      value={collectionData.containerType}
                      onChange={(e) => setCollectionData({
                        ...collectionData,
                        containerType: e.target.value
                      })}
                      placeholder="e.g., EDTA tube, Plain tube"
                    />
                    <Input
                      label="Sample Volume"
                      value={collectionData.sampleVolume}
                      onChange={(e) => setCollectionData({
                        ...collectionData,
                        sampleVolume: e.target.value
                      })}
                      placeholder="e.g., 5ml, 10ml"
                    />
                  </div>

                  <Select
                    label="Storage Conditions"
                    value={collectionData.storageConditions}
                    onChange={(e) => setCollectionData({
                      ...collectionData,
                      storageConditions: e.target.value
                    })}
                    options={[
                      { value: 'Room Temperature', label: 'Room Temperature' },
                      { value: 'Refrigerated (2-8°C)', label: 'Refrigerated (2-8°C)' },
                      { value: 'Frozen (-20°C)', label: 'Frozen (-20°C)' },
                      { value: 'Frozen (-80°C)', label: 'Frozen (-80°C)' },
                    ]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Notes
                    </label>
                    <textarea
                      value={collectionData.clerkNotes}
                      onChange={(e) => setCollectionData({
                        ...collectionData,
                        clerkNotes: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Any notes about the sample collection process..."
                    />
                  </div>

                  {collectionData.sampleQuality === 'Poor' || collectionData.sampleQuality === 'Rejected' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Issues <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={collectionData.sampleQualityNotes}
                        onChange={(e) => setCollectionData({
                          ...collectionData,
                          sampleQualityNotes: e.target.value
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Describe the quality issues with this sample..."
                        required
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedSample(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSampleCollection}
                    isLoading={saving}
                    className={collectionData.sampleQuality === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {collectionData.sampleQuality === 'Rejected' ? 'Reject Sample' : 'Collect Sample'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a sample from the list to begin collection</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}