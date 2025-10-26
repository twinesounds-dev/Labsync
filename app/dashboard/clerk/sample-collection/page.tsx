'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { 
  TestTube, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Thermometer,
  Droplets,
  Camera,
  QrCode,
  User,
  Calendar,
  MapPin,
  FileText,
  Shield,
  Zap
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestRequest } from '@/types';
import { format } from 'date-fns';

interface SampleInfo {
  sampleId: string;
  testId: string;
  testName: string;
  sampleType: string;
  containerType: string;
  volume: string;
  temperature: string;
  collectionTime: Date;
  collectedBy: string;
  patientCondition: string;
  fastingStatus: string;
  medicationStatus: string;
  qualityCheck: {
    appearance: string;
    volume_adequate: boolean;
    container_integrity: boolean;
    labeling_correct: boolean;
    temperature_maintained: boolean;
    collection_time_appropriate: boolean;
  };
  rejectionReason?: string;
  status: 'Pending' | 'Collected' | 'Accepted' | 'Rejected';
}

export default function SampleCollectionPage() {
  const { userProfile } = useAuth();
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [collectionMode, setCollectionMode] = useState<'queue' | 'collection' | 'qa'>('queue');
  const [currentSample, setCurrentSample] = useState<SampleInfo | null>(null);

  // QA Form States
  const [qaForm, setQaForm] = useState({
    appearance: '',
    volume_adequate: true,
    container_integrity: true,
    labeling_correct: true,
    temperature_maintained: true,
    collection_time_appropriate: true,
    notes: '',
  });

  // Collection Form States
  const [collectionForm, setCollectionForm] = useState({
    patientCondition: 'Normal',
    fastingStatus: 'Unknown',
    medicationStatus: 'None Reported',
    temperature: '20',
    volume: '',
    notes: '',
  });

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Get paid test requests awaiting sample collection
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      where('paymentStatus', '==', 'Paid'),
      orderBy('requestDate', 'asc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        sampleCollectionDate: doc.data().sampleCollectionDate?.toDate(),
        sampleReceivedDate: doc.data().sampleReceivedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestRequest[];

      setTestRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const generateSampleId = (testName: string, patientId: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const testCode = testName.substring(0, 3).toUpperCase();
    return `${testCode}-${patientId}-${timestamp}`;
  };

  const initializeSampleCollection = (request: TestRequest) => {
    const newSamples: SampleInfo[] = request.tests.map((test) => ({
      sampleId: generateSampleId(test.test?.name || 'TEST', request.patient?.patientId || ''),
      testId: test.testId,
      testName: test.test?.name || 'Unknown Test',
      sampleType: test.test?.sampleType || 'Blood',
      containerType: test.test?.containerType || 'EDTA Tube',
      volume: '',
      temperature: '20',
      collectionTime: new Date(),
      collectedBy: userProfile?.id || '',
      patientCondition: 'Normal',
      fastingStatus: 'Unknown',
      medicationStatus: 'None Reported',
      qualityCheck: {
        appearance: 'Normal',
        volume_adequate: true,
        container_integrity: true,
        labeling_correct: true,
        temperature_maintained: true,
        collection_time_appropriate: true,
      },
      status: 'Pending',
    }));

    setSamples(newSamples);
    setSelectedRequest(request);
    setCollectionMode('collection');
  };

  const collectSample = (sampleIndex: number) => {
    const updatedSamples = [...samples];
    updatedSamples[sampleIndex] = {
      ...updatedSamples[sampleIndex],
      ...collectionForm,
      collectionTime: new Date(),
      status: 'Collected',
    };
    setSamples(updatedSamples);
    setCurrentSample(updatedSamples[sampleIndex]);
    setCollectionMode('qa');
  };

  const performQualityCheck = async (accept: boolean) => {
    if (!currentSample || !selectedRequest) return;

    const sampleIndex = samples.findIndex(s => s.sampleId === currentSample.sampleId);
    const updatedSamples = [...samples];
    
    updatedSamples[sampleIndex] = {
      ...updatedSamples[sampleIndex],
      qualityCheck: qaForm,
      status: accept ? 'Accepted' : 'Rejected',
      rejectionReason: accept ? undefined : qaForm.notes,
    };

    setSamples(updatedSamples);

    // Check if all samples are processed
    const allProcessed = updatedSamples.every(s => s.status === 'Accepted' || s.status === 'Rejected');
    
    if (allProcessed) {
      const acceptedSamples = updatedSamples.filter(s => s.status === 'Accepted');
      
      if (acceptedSamples.length > 0) {
        // Update the test request with sample collection data
        await firestoreService.update(COLLECTIONS.TEST_REQUESTS, selectedRequest.id, {
          sampleReceivedDate: new Date(),
          sampleReceivedBy: userProfile?.id,
          overallStatus: 'SampleReceived',
          sampleCollectionData: updatedSamples,
          sampleQualityNotes: qaForm.notes,
        });

        alert(`Sample collection completed! ${acceptedSamples.length} samples accepted, ${updatedSamples.length - acceptedSamples.length} rejected.`);
      } else {
        alert('All samples were rejected. Please collect new samples.');
      }

      // Reset for next patient
      setCollectionMode('queue');
      setSelectedRequest(null);
      setSamples([]);
      setCurrentSample(null);
    } else {
      // Move to next sample
      const nextPendingSample = updatedSamples.find(s => s.status === 'Collected');
      if (nextPendingSample) {
        setCurrentSample(nextPendingSample);
      } else {
        setCollectionMode('collection');
        setCurrentSample(null);
      }
    }

    // Reset QA form
    setQaForm({
      appearance: '',
      volume_adequate: true,
      container_integrity: true,
      labeling_correct: true,
      temperature_maintained: true,
      collection_time_appropriate: true,
      notes: '',
    });
  };

  const filteredRequests = testRequests.filter(
    (request) =>
      !request.sampleReceivedDate &&
      (request.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       request.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       request.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT': return 'bg-red-500';
      case 'Urgent': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getSampleTypeIcon = (sampleType: string) => {
    switch (sampleType.toLowerCase()) {
      case 'blood': return <Droplets className="w-5 h-5 text-red-500" />;
      case 'urine': return <TestTube className="w-5 h-5 text-yellow-500" />;
      case 'stool': return <TestTube className="w-5 h-5 text-brown-500" />;
      default: return <TestTube className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading sample collection queue...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample Collection & QA</h1>
            <p className="text-gray-600 mt-1">
              Innovative sample collection with integrated quality assurance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              collectionMode === 'queue' ? 'bg-blue-100 text-blue-800' :
              collectionMode === 'collection' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {collectionMode === 'queue' ? 'Queue Mode' :
               collectionMode === 'collection' ? 'Collection Mode' : 'QA Mode'}
            </div>
          </div>
        </div>

        {collectionMode === 'queue' && (
          <>
            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="lg:col-span-3">
                <Card>
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by patient ID or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border-none focus:ring-0"
                    />
                  </div>
                </Card>
              </div>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{filteredRequests.length}</div>
                  <div className="text-sm text-blue-600">Pending Collections</div>
                </div>
              </Card>
            </div>

            {/* Queue List */}
            <Card title="Sample Collection Queue">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Samples Awaiting Collection
                  </h3>
                  <p className="text-gray-600">
                    Patients will appear here once payment is confirmed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className={`w-3 h-3 rounded-full ${getUrgencyColor(request.patient?.urgency || 'Routine')}`}></div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.patient?.surname} {request.patient?.givenName}
                            </h3>
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              ID: {request.patient?.patientId}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              request.patient?.urgency === 'STAT' ? 'bg-red-100 text-red-800' :
                              request.patient?.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {request.patient?.urgency}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {request.patient?.gender}, {request.patient?.dateOfBirth?.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Requested: {format(request.requestDate, 'dd MMM HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {request.patient?.address?.district}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {request.tests.length} test(s)
                              </span>
                            </div>
                          </div>

                          {/* Tests Preview */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Tests Requested:</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.tests.map((test, index) => (
                                <div key={index} className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
                                  {getSampleTypeIcon(test.test?.sampleType || 'blood')}
                                  <span className="text-sm font-medium">{test.test?.name}</span>
                                  <span className="text-xs text-gray-500">({test.test?.sampleType})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Patient Condition Indicators */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span className="text-gray-600">Payment Confirmed</span>
                            </div>
                            {request.patient?.urgency === 'STAT' && (
                              <div className="flex items-center space-x-1">
                                <Zap className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 font-medium">STAT Priority</span>
                              </div>
                            )}
                            {request.clerkNotes && (
                              <div className="flex items-center space-x-1">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="text-orange-600">Special Notes</span>
                              </div>
                            )}
                          </div>

                          {request.clerkNotes && (
                            <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                              <span className="text-sm font-medium text-orange-900">Special Instructions: </span>
                              <span className="text-sm text-orange-800">{request.clerkNotes}</span>
                            </div>
                          )}
                        </div>

                        <div className="ml-6">
                          <Button
                            onClick={() => initializeSampleCollection(request)}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary-600"
                          >
                            <TestTube className="w-4 h-4" />
                            <span>Start Collection</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {collectionMode === 'collection' && selectedRequest && (
          <div className="space-y-6">
            {/* Patient Info Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Collecting Samples: {selectedRequest.patient?.surname} {selectedRequest.patient?.givenName}
                  </h2>
                  <p className="text-gray-600">Patient ID: {selectedRequest.patient?.patientId}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCollectionMode('queue');
                    setSelectedRequest(null);
                    setSamples([]);
                  }}
                >
                  Back to Queue
                </Button>
              </div>
            </Card>

            {/* Sample Collection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {samples.map((sample, index) => (
                <Card key={sample.sampleId} className={`${
                  sample.status === 'Collected' ? 'border-green-300 bg-green-50' :
                  sample.status === 'Accepted' ? 'border-blue-300 bg-blue-50' :
                  sample.status === 'Rejected' ? 'border-red-300 bg-red-50' :
                  'border-gray-200'
                }`}>
                  <div className="space-y-4">
                    {/* Sample Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getSampleTypeIcon(sample.sampleType)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{sample.testName}</h3>
                          <p className="text-sm text-gray-600">ID: {sample.sampleId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-5 h-5 text-gray-400" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sample.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          sample.status === 'Collected' ? 'bg-green-100 text-green-800' :
                          sample.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sample.status}
                        </span>
                      </div>
                    </div>

                    {/* Sample Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Sample Type:</span>
                        <div className="font-medium">{sample.sampleType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Container:</span>
                        <div className="font-medium">{sample.containerType}</div>
                      </div>
                    </div>

                    {sample.status === 'Pending' && (
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900">Collection Information</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            label="Patient Condition"
                            value={collectionForm.patientCondition}
                            onChange={(e) => setCollectionForm({...collectionForm, patientCondition: e.target.value})}
                            options={[
                              { value: 'Normal', label: 'Normal' },
                              { value: 'Anxious', label: 'Anxious' },
                              { value: 'Dehydrated', label: 'Dehydrated' },
                              { value: 'Difficult Draw', label: 'Difficult Draw' },
                            ]}
                          />
                          
                          <Select
                            label="Fasting Status"
                            value={collectionForm.fastingStatus}
                            onChange={(e) => setCollectionForm({...collectionForm, fastingStatus: e.target.value})}
                            options={[
                              { value: 'Fasting', label: 'Fasting (8+ hrs)' },
                              { value: 'Non-Fasting', label: 'Non-Fasting' },
                              { value: 'Unknown', label: 'Unknown' },
                            ]}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Volume (mL)"
                            type="number"
                            value={collectionForm.volume}
                            onChange={(e) => setCollectionForm({...collectionForm, volume: e.target.value})}
                            placeholder="5.0"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <Thermometer className="w-4 h-4 text-gray-500" />
                            <Input
                              label="Temperature (°C)"
                              type="number"
                              value={collectionForm.temperature}
                              onChange={(e) => setCollectionForm({...collectionForm, temperature: e.target.value})}
                            />
                          </div>
                        </div>

                        <Input
                          label="Collection Notes"
                          value={collectionForm.notes}
                          onChange={(e) => setCollectionForm({...collectionForm, notes: e.target.value})}
                          placeholder="Any special observations..."
                        />

                        <Button
                          onClick={() => collectSample(index)}
                          className="w-full flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Collect Sample</span>
                        </Button>
                      </div>
                    )}

                    {sample.status !== 'Pending' && (
                      <div className="pt-4 border-t text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-gray-600">Collected:</span> {sample.collectionTime.toLocaleTimeString()}</div>
                          <div><span className="text-gray-600">Volume:</span> {sample.volume} mL</div>
                          <div><span className="text-gray-600">Condition:</span> {sample.patientCondition}</div>
                          <div><span className="text-gray-600">Fasting:</span> {sample.fastingStatus}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Next Steps */}
            <Card>
              <div className="text-center py-4">
                <Clock className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Collect all samples, then proceed to Quality Assurance
                </h3>
                <p className="text-gray-600">
                  Each sample will undergo QA checks before being accepted for testing
                </p>
              </div>
            </Card>
          </div>
        )}

        {collectionMode === 'qa' && currentSample && (
          <div className="space-y-6">
            {/* QA Header */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Quality Assurance: {currentSample.testName}
                  </h2>
                  <p className="text-gray-600">Sample ID: {currentSample.sampleId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">QA Mode</span>
                </div>
              </div>
            </Card>

            {/* QA Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Visual Inspection">
                <div className="space-y-4">
                  <Select
                    label="Sample Appearance"
                    value={qaForm.appearance}
                    onChange={(e) => setQaForm({...qaForm, appearance: e.target.value})}
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Hemolyzed', label: 'Hemolyzed' },
                      { value: 'Lipemic', label: 'Lipemic' },
                      { value: 'Icteric', label: 'Icteric' },
                      { value: 'Clotted', label: 'Clotted' },
                      { value: 'Contaminated', label: 'Contaminated' },
                    ]}
                  />

                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <Button variant="outline" size="sm">
                      Capture Sample Image
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Quality Checks">
                <div className="space-y-4">
                  {[
                    { key: 'volume_adequate', label: 'Adequate Volume' },
                    { key: 'container_integrity', label: 'Container Integrity' },
                    { key: 'labeling_correct', label: 'Correct Labeling' },
                    { key: 'temperature_maintained', label: 'Temperature Maintained' },
                    { key: 'collection_time_appropriate', label: 'Timely Collection' },
                  ].map((check) => (
                    <div key={check.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{check.label}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setQaForm({...qaForm, [check.key]: true})}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            qaForm[check.key as keyof typeof qaForm] === true
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => setQaForm({...qaForm, [check.key]: false})}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            qaForm[check.key as keyof typeof qaForm] === false
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* QA Notes and Actions */}
            <Card title="QA Notes & Decision">
              <div className="space-y-4">
                <Input
                  label="QA Notes"
                  value={qaForm.notes}
                  onChange={(e) => setQaForm({...qaForm, notes: e.target.value})}
                  placeholder="Document any observations or issues..."
                />

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => performQualityCheck(false)}
                    variant="outline"
                    className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reject Sample</span>
                  </Button>
                  
                  <Button
                    onClick={() => performQualityCheck(true)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Sample</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}