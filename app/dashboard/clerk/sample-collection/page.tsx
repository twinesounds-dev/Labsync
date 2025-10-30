'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TestRequest, Patient, Test, Sample, SampleCollectionData, SampleStatus } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { 
  TestTube, 
  Search, 
  User,
  Calendar,
  FileText,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Beaker
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  getSampleRequirementsForTests, 
  getSampleTypeName, 
  getContainerTypeName
} from '@/lib/sample-mapping';

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
  const [samples, setSamples] = useState<Sample[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [patientConditionNotes, setPatientConditionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test requests that are paid but samples not yet collected
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const samplesData: PendingSample[] = [];

      for (const doc of snapshot.docs) {
        const requestData = { id: doc.id, ...doc.data() } as PendingSample;

        // Filter: Only include if sample collection not completed
        if (requestData.sampleCollectionStatus === 'COLLECTED' || 
            requestData.sampleCollectionStatus === 'SENT_TO_LAB') {
          continue;
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

      // Sort by request date (oldest first)
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

  const handleSelectSample = (sample: PendingSample) => {
    setSelectedSample(sample);
    setCurrentSampleIndex(0);
    setSessionNotes('');
    setPatientConditionNotes('');

    // Generate required samples based on tests
    if (sample.tests) {
      const testCodes = sample.tests.map(t => t.code);
      const { sampleGroups } = getSampleRequirementsForTests(testCodes);
      
      const generatedSamples: Sample[] = [];
      let sampleCounter = 1;

      sampleGroups.forEach((group, sampleType) => {
        const sample: Sample = {
          id: `SAMPLE-${Date.now()}-${sampleCounter++}`,
          sampleType: sampleType,
          containerType: group.containerType,
          volumeRequired: group.volumeRequired,
          volumeCollected: '',
          collectionTime: new Date(),
          collectedBy: userProfile?.id || '',
          status: 'PENDING',
          qualityChecks: [],
          relatedTestIds: group.tests,
          notes: group.collectionInstructions.join('; '),
        };
        generatedSamples.push(sample);
      });

      setSamples(generatedSamples);
    }
  };

  const handleQualityCheck = (checkType: 'volume' | 'container' | 'labeling' | 'integrity' | 'timing', passed: boolean, notes?: string) => {
    const updatedSamples = [...samples];
    const currentSample = updatedSamples[currentSampleIndex];
    
    // Remove existing check of this type
    currentSample.qualityChecks = currentSample.qualityChecks.filter(qc => qc.checkType !== checkType);
    
    // Add new check
    currentSample.qualityChecks.push({
      checkType,
      passed,
      notes,
      checkedAt: new Date(),
    });

    setSamples(updatedSamples);
  };

  const handleSampleStatusUpdate = (status: SampleStatus, volumeCollected?: string, notes?: string) => {
    const updatedSamples = [...samples];
    const currentSample = updatedSamples[currentSampleIndex];
    
    currentSample.status = status;
    if (volumeCollected) currentSample.volumeCollected = volumeCollected;
    if (notes) currentSample.notes = (currentSample.notes || '') + ' | ' + notes;
    currentSample.collectionTime = new Date();

    setSamples(updatedSamples);
  };

  const canProceedToNextSample = () => {
    const currentSample = samples[currentSampleIndex];
    if (!currentSample) return false;

    // Must have collected or rejected status
    if (currentSample.status === 'PENDING') return false;

    // If collected, must have volume and passed quality checks
    if (currentSample.status === 'COLLECTED') {
      if (!currentSample.volumeCollected) return false;
      
      // Check if all quality checks passed
      const allChecksPassed = currentSample.qualityChecks.length >= 3 && 
        currentSample.qualityChecks.every(qc => qc.passed);
      
      return allChecksPassed;
    }

    // Rejected samples can proceed
    return true;
  };

  const handleCompleteCollection = async () => {
    if (!selectedSample || !userProfile) return;

    try {
      setSaving(true);

      // Determine overall quality status
      const rejectedSamples = samples.filter(s => s.status === 'REJECTED' || s.status === 'INSUFFICIENT' || s.status === 'CONTAMINATED' || s.status === 'HEMOLYZED' || s.status === 'CLOTTED');
      
      let overallQualityStatus: 'PASSED' | 'PARTIAL' | 'FAILED' = 'PASSED';
      if (rejectedSamples.length === samples.length) {
        overallQualityStatus = 'FAILED';
      } else if (rejectedSamples.length > 0) {
        overallQualityStatus = 'PARTIAL';
      }

      const collectionData: SampleCollectionData = {
        sessionId: `SESSION-${Date.now()}`,
        collectionDate: new Date(),
        collectedBy: userProfile.id,
        samples: samples,
        overallQualityStatus: overallQualityStatus,
        rejectionReasons: rejectedSamples.map(s => `${getSampleTypeName(s.sampleType)}: ${s.notes || s.status}`),
        specialInstructions: sessionNotes,
        patientConditionNotes: patientConditionNotes,
        recollectionRequired: overallQualityStatus === 'FAILED' || overallQualityStatus === 'PARTIAL',
        recollectionReasons: rejectedSamples.length > 0 ? rejectedSamples.map(s => getSampleTypeName(s.sampleType)) : undefined,
      };

      // Update test request
      await firestoreService.update(COLLECTIONS.TEST_REQUESTS, selectedSample.id, {
        sampleCollectionStatus: overallQualityStatus === 'FAILED' ? 'REJECTED' : 'COLLECTED',
        sampleCollectionDate: new Date(),
        sampleReceivedDate: new Date(),
        sampleReceivedBy: userProfile.id,
        sampleCollectionData: collectionData,
        overallStatus: overallQualityStatus === 'FAILED' ? 'Pending' : 'SampleCollected',
        updatedAt: new Date(),
      });

      // Reset form
      setSelectedSample(null);
      setSamples([]);
      setCurrentSampleIndex(0);
      setSessionNotes('');
      setPatientConditionNotes('');

      alert(`Sample collection completed! Status: ${overallQualityStatus}`);
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

  const currentSample = samples[currentSampleIndex];

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
            <h1 className="text-3xl font-bold text-gray-900">Sample Collection & Quality Control</h1>
            <p className="text-gray-600 mt-1">Collect and validate patient samples for laboratory testing</p>
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

        {!selectedSample ? (
          /* Pending Samples List */
          <Card title="Pending Sample Collection" subtitle={`${filteredSamples.length} patients awaiting sample collection`}>
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
                <p className="text-sm text-gray-400 mt-2">Patients will appear here after payment is confirmed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSamples.map((sample) => (
                  <div 
                    key={sample.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectSample(sample)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <TestTube className="w-5 h-5 text-blue-600" />
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
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(sample.requestDate)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          sample.patient?.urgency === 'STAT' ? 'bg-red-100 text-red-800' :
                          sample.patient?.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sample.patient?.urgency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{sample.patient?.gender} • {sample.patient ? Math.floor((Date.now() - new Date(sample.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        <span>{sample.tests?.length || 0} tests</span>
                      </div>
                    </div>

                    {sample.tests && sample.tests.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {sample.tests.map((test, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {test.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <Button size="sm">
                        <Beaker className="w-4 h-4 mr-2" />
                        Begin Collection
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          /* Sample Collection Workflow */
          <div className="space-y-6">
            {/* Patient Summary Card */}
            <Card>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSample.patient?.patientId}</h2>
                    <p className="text-lg text-gray-700">{selectedSample.patient?.surname}, {selectedSample.patient?.givenName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{selectedSample.patient?.gender} • {selectedSample.patient ? Math.floor((Date.now() - new Date(selectedSample.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedSample.patient?.urgency === 'STAT' ? 'bg-red-100 text-red-800' :
                      selectedSample.patient?.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSample.patient?.urgency}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900">{selectedSample.patient?.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tests Ordered:</span>
                    <p className="text-gray-900">{selectedSample.tests?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Samples Required:</span>
                    <p className="text-gray-900">{samples.length}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2">
              {samples.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index < currentSampleIndex ? 'bg-green-500 text-white' :
                    index === currentSampleIndex ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentSampleIndex ? <CheckCircle className="w-6 h-6" /> : index + 1}
                  </div>
                  {index < samples.length - 1 && (
                    <div className={`w-12 h-1 ${index < currentSampleIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Current Sample Collection */}
            {currentSample && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sample Info */}
                <Card title={`Sample ${currentSampleIndex + 1} of ${samples.length}`} subtitle={getSampleTypeName(currentSample.sampleType)}>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Collection Requirements</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Container:</span>
                          <span>{getContainerTypeName(currentSample.containerType)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Volume Required:</span>
                          <span>{currentSample.volumeRequired}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tests Using This Sample:</span>
                          <span>{currentSample.relatedTestIds.length}</span>
                        </div>
                      </div>
                    </div>

                    {currentSample.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <div className="flex">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-yellow-900 text-sm">Special Instructions</h5>
                            <p className="text-sm text-yellow-800 mt-1">{currentSample.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tests Requiring This Sample:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSample.tests?.filter(t => currentSample.relatedTestIds.includes(t.code)).map((test, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {test.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quality Control */}
                <Card title="Quality Control Checks" subtitle="Complete all checks before proceeding">
                  <div className="space-y-4">
                    {/* Volume Check */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">Volume Check</h5>
                        {currentSample.qualityChecks.find(qc => qc.checkType === 'volume')?.passed && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <Input
                        label="Volume Collected"
                        value={currentSample.volumeCollected || ''}
                        onChange={(e) => {
                          const updatedSamples = [...samples];
                          updatedSamples[currentSampleIndex].volumeCollected = e.target.value;
                          setSamples(updatedSamples);
                        }}
                        placeholder="e.g., 5ml"
                      />
                      <div className="mt-2 flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQualityCheck('volume', true, `Sufficient volume: ${currentSample.volumeCollected}`)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Sufficient
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            handleQualityCheck('volume', false, 'Insufficient volume');
                            handleSampleStatusUpdate('INSUFFICIENT');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Insufficient
                        </Button>
                      </div>
                    </div>

                    {/* Container Check */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">Container Check</h5>
                        {currentSample.qualityChecks.find(qc => qc.checkType === 'container')?.passed && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Verify correct container type and condition</p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQualityCheck('container', true, 'Correct container, good condition')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pass
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            handleQualityCheck('container', false, 'Wrong container or damaged');
                            handleSampleStatusUpdate('REJECTED', undefined, 'Container issue');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Fail
                        </Button>
                      </div>
                    </div>

                    {/* Labeling Check */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">Labeling Check</h5>
                        {currentSample.qualityChecks.find(qc => qc.checkType === 'labeling')?.passed && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Verify patient ID, date, and time on label</p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQualityCheck('labeling', true, 'Properly labeled')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pass
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQualityCheck('labeling', false, 'Labeling issue')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Fail
                        </Button>
                      </div>
                    </div>

                    {/* Integrity Check */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">Sample Integrity</h5>
                        {currentSample.qualityChecks.find(qc => qc.checkType === 'integrity')?.passed && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Check for hemolysis, clotting, or contamination</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQualityCheck('integrity', true, 'Good integrity')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Good
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            handleQualityCheck('integrity', false, 'Hemolyzed');
                            handleSampleStatusUpdate('HEMOLYZED');
                          }}
                        >
                          Hemolyzed
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            handleQualityCheck('integrity', false, 'Clotted');
                            handleSampleStatusUpdate('CLOTTED');
                          }}
                        >
                          Clotted
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            handleQualityCheck('integrity', false, 'Contaminated');
                            handleSampleStatusUpdate('CONTAMINATED');
                          }}
                        >
                          Contaminated
                        </Button>
                      </div>
                    </div>

                    {/* Accept Sample */}
                    {currentSample.status !== 'COLLECTED' && canProceedToNextSample() && (
                      <div className="pt-4 border-t">
                        <Button 
                          onClick={() => handleSampleStatusUpdate('COLLECTED', currentSample.volumeCollected)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Sample
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Session Notes */}
            <Card title="Session Notes">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Condition Notes
                  </label>
                  <textarea
                    value={patientConditionNotes}
                    onChange={(e) => setPatientConditionNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Patient fasting, Patient dehydrated, Patient cooperative..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    General Collection Notes
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Any additional notes about the collection session..."
                  />
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel? All progress will be lost.')) {
                    setSelectedSample(null);
                    setSamples([]);
                    setCurrentSampleIndex(0);
                  }
                }}
              >
                Cancel
              </Button>
              
              <div className="flex space-x-2">
                {currentSampleIndex > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentSampleIndex(currentSampleIndex - 1)}
                  >
                    Previous Sample
                  </Button>
                )}
                
                {currentSampleIndex < samples.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentSampleIndex(currentSampleIndex + 1)}
                    disabled={!canProceedToNextSample()}
                  >
                    Next Sample
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCompleteCollection}
                    isLoading={saving}
                    disabled={!canProceedToNextSample()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Complete Collection
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
