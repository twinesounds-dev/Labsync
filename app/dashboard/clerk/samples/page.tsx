'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  MapPin,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SampleWithDetails extends Omit<TestRequest, 'tests'> {
  patient?: Patient;
  tests?: Test[];
}

function SampleTrackingContent() {
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const [samples, setSamples] = useState<SampleWithDetails[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<SampleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Handle URL parameters for filters
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'today') {
      setDateFilter('today');
      setStatusFilter('all');
    } else if (filter === 'rejected') {
      setStatusFilter('rejected');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test requests with real-time updates
    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', userProfile.facilityId),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const samplesData: SampleWithDetails[] = [];

      for (const doc of snapshot.docs) {
        const requestData = { id: doc.id, ...doc.data() } as SampleWithDetails;

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

      setSamples(samplesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  useEffect(() => {
    let filtered = samples;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sample => 
        sample.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'rejected') {
        // Filter for rejected samples (sample quality rejected)
        filtered = filtered.filter(sample => 
          sample.sampleCollectionData?.overallQualityStatus === 'FAILED' ||
          sample.sampleCollectionStatus === 'REJECTED'
        );
      } else {
        filtered = filtered.filter(sample => sample.overallStatus === statusFilter);
      }
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      filtered = filtered.filter(sample => {
        const sampleDate = new Date(sample.requestDate);
        sampleDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return sampleDate.getTime() === today.getTime();
          case 'yesterday':
            return sampleDate.getTime() === yesterday.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return sampleDate >= weekAgo;
          default:
            return true;
        }
      });
    }

    setFilteredSamples(filtered);
  }, [samples, searchTerm, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SampleReceived':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'InProgress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'SampleReceived':
        return <TestTube className="w-4 h-4" />;
      case 'InProgress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Completed':
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
          <div className="text-gray-500">Loading samples...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor sample collection, processing, and status</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/dashboard/clerk/sample-collection">
              <Button>
                <TestTube className="w-4 h-4 mr-2" />
                Collect Samples
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Patient ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Pending', label: 'Pending Payment' },
                { value: 'AwaitingPayment', label: 'Awaiting Payment' },
                { value: 'ReadyForCollection', label: 'Ready for Collection' },
                { value: 'SampleCollected', label: 'Sample Collected' },
                { value: 'InLab', label: 'In Lab' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected Samples' },
              ]}
            />
            <Select
              label="Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'week', label: 'This Week' },
              ]}
            />
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Sample Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Awaiting Collection</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {filteredSamples.filter(s => s.overallStatus === 'Pending' && s.paymentStatus === 'Paid').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Collected Today</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredSamples.filter(s => {
                    if (!s.sampleCollectionDate) return false;
                    const today = new Date();
                    const collectionDate = new Date(s.sampleCollectionDate);
                    return collectionDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <TestTube className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-purple-900">
                  {filteredSamples.filter(s => s.overallStatus === 'InProgress').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Ready for Lab</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredSamples.filter(s => s.overallStatus === 'SampleCollected' || s.overallStatus === 'InLab').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Samples List */}
        <Card title="Sample Tracking List" subtitle={`${filteredSamples.length} samples`}>
          {filteredSamples.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No samples found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSamples.map((sample) => (
                <div key={sample.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <TestTube className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {sample.patient?.patientId || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {sample.patient?.surname}, {sample.patient?.givenName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sample.overallStatus)}`}>
                        {getStatusIcon(sample.overallStatus)}
                        <span className="ml-1">{sample.overallStatus}</span>
                      </span>
                      <Link href={`/dashboard/clerk/samples/${sample.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Requested: {formatDate(sample.requestDate)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Age: {sample.patient ? Math.floor((Date.now() - new Date(sample.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{sample.patient?.address.district || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{sample.tests?.length || 0} tests</span>
                    </div>
                  </div>

                  {sample.sampleCollectionDate && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Sample collected: {formatDate(sample.sampleCollectionDate)}
                        </span>
                        {sample.sampleReceivedBy && (
                          <span className="text-gray-600">
                            By: {sample.sampleReceivedBy}
                          </span>
                        )}
                      </div>
                      {sample.clerkNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Notes: {sample.clerkNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {sample.tests && sample.tests.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Requested Tests:</p>
                      <div className="flex flex-wrap gap-2">
                        {sample.tests.map((test, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {test.name} ({test.code})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function SampleTrackingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <SampleTrackingContent />
    </Suspense>
  );
}