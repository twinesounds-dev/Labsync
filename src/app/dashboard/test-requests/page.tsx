'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import TestRequestForm from '@/components/test-requests/TestRequestForm';
import { TestRequest, Patient, Test } from '@/lib/types';

export default function TestRequestsPage() {
  const { user } = useAuth();
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TestRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockRequests: TestRequest[] = [
      {
        id: '1',
        patientId: '1',
        patient: {
          id: '1',
          patientId: 'FLNT-00123',
          surname: 'Doe',
          givenName: 'John',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Male',
          maritalStatus: 'Married',
          phoneNumber: '+256 700 123 456',
          facilityId: 'flnt',
          registrationDate: new Date('2024-12-20'),
          address: {
            village: 'Kampala Central',
            parish: 'Nakasero',
            subCounty: 'Kampala Central',
            district: 'Kampala',
          },
          urgency: 'Routine',
          paymentType: 'Cash',
          isActive: true,
          createdAt: new Date('2024-12-20'),
          updatedAt: new Date('2024-12-20'),
        },
        facilityId: 'flnt',
        tests: [
          {
            testId: 'fbc',
            test: {
              id: 'fbc',
              categoryId: 'hematology',
              name: 'Full Hemogram',
              code: 'FBC',
              price: 15000,
              turnaroundTime: '2 hours',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            status: 'Pending',
            priority: 1,
          },
          {
            testId: 'mp',
            test: {
              id: 'mp',
              categoryId: 'hematology',
              name: 'Malaria Parasite Test',
              code: 'MP',
              price: 5000,
              turnaroundTime: '30 mins',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            status: 'Pending',
            priority: 2,
          },
        ],
        urgency: 'Routine',
        referringDoctor: 'Dr. Smith',
        hospitalClinic: 'Kampala Hospital',
        clinicalHistory: 'Routine checkup',
        status: 'Pending',
        requestedBy: 'user1',
        requestedAt: new Date('2024-12-24T09:00:00'),
        clerkNotes: 'Patient looks healthy, no special instructions',
      },
      {
        id: '2',
        patientId: '2',
        patient: {
          id: '2',
          patientId: 'FLNT-00124',
          surname: 'Smith',
          givenName: 'Jane',
          dateOfBirth: new Date('1990-08-22'),
          gender: 'Female',
          maritalStatus: 'Single',
          phoneNumber: '+256 700 987 654',
          facilityId: 'flnt',
          registrationDate: new Date('2024-12-21'),
          address: {
            village: 'Mbarara Town',
            parish: 'Kakoba',
            subCounty: 'Mbarara Municipality',
            district: 'Mbarara',
          },
          urgency: 'Urgent',
          paymentType: 'Insurance',
          insuranceProvider: 'AAR Insurance',
          insuranceNumber: 'AAR123456',
          isActive: true,
          createdAt: new Date('2024-12-21'),
          updatedAt: new Date('2024-12-21'),
        },
        facilityId: 'flnt',
        tests: [
          {
            testId: 'bhcg',
            test: {
              id: 'bhcg',
              categoryId: 'hormones',
              name: 'Beta HCG',
              code: 'BHCG',
              price: 25000,
              turnaroundTime: '2 hours',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            status: 'In Progress',
            priority: 1,
          },
        ],
        urgency: 'Urgent',
        referringDoctor: 'Dr. Johnson',
        hospitalClinic: 'Mbarara Hospital',
        clinicalHistory: 'Pregnancy test',
        status: 'In Progress',
        requestedBy: 'user1',
        requestedAt: new Date('2024-12-24T10:30:00'),
        technicianNotes: 'Sample received, processing in progress',
      },
    ];

    setTestRequests(mockRequests);
    setFilteredRequests(mockRequests);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = testRequests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, testRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Pending':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-yellow-100 text-yellow-800';
      case 'Routine':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (request: TestRequest) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  };

  const handleView = (request: TestRequest) => {
    setSelectedRequest(request);
    // In a real app, this would navigate to a detailed view
    console.log('View request:', request);
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setTestRequests(requests =>
      requests.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  const handleFormSubmit = (requestData: Omit<TestRequest, 'id' | 'requestedAt'>) => {
    if (selectedRequest) {
      // Update existing request
      const updatedRequests = testRequests.map(req =>
        req.id === selectedRequest.id
          ? { ...req, ...requestData }
          : req
      );
      setTestRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
    } else {
      // Add new request
      const newRequest: TestRequest = {
        ...requestData,
        id: Date.now().toString(),
        requestedAt: new Date(),
      };
      setTestRequests([newRequest, ...testRequests]);
      setFilteredRequests([newRequest, ...filteredRequests]);
    }
    setIsFormOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Requests</h1>
          <p className="text-gray-600 mt-2">
            Manage laboratory test requests and workflow
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests by patient name, ID, or request number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No test requests found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by creating your first test request'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.patient?.givenName} {request.patient?.surname}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {request.patient?.patientId} | Request: {request.id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Tests:</strong> {request.tests.length} test(s)
                        </p>
                        <div className="mt-1 space-y-1">
                          {request.tests.map((testItem, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{testItem.test?.name} ({testItem.test?.code})</span>
                              <span className="text-gray-500">{formatCurrency(testItem.test?.price || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Requested:</strong> {formatDate(request.requestedAt)}
                        </p>
                        {request.referringDoctor && (
                          <p className="text-sm text-gray-600">
                            <strong>Doctor:</strong> {request.referringDoctor}
                          </p>
                        )}
                        {request.hospitalClinic && (
                          <p className="text-sm text-gray-600">
                            <strong>Hospital:</strong> {request.hospitalClinic}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.clinicalHistory && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Clinical History:</strong> {request.clinicalHistory}
                        </p>
                      </div>
                    )}

                    {request.clerkNotes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Clerk Notes:</strong> {request.clerkNotes}
                        </p>
                      </div>
                    )}

                    {request.technicianNotes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Technician Notes:</strong> {request.technicianNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Total: {formatCurrency(request.tests.reduce((sum, test) => sum + (test.test?.price || 0), 0))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {request.status === 'Pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(request.id, 'In Progress')}
                          >
                            Start Processing
                          </Button>
                        )}
                        {request.status === 'In Progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(request.id, 'Completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Test Request Form Modal */}
      {isFormOpen && (
        <TestRequestForm
          request={selectedRequest}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}