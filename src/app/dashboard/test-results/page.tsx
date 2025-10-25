'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Eye, Edit, CheckCircle, Clock, AlertCircle, Microscope } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import TestResultForm from '@/components/test-results/TestResultForm';
import { TestResult, TestRequest, Patient, Test, User } from '@/lib/types';

export default function TestResultsPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockResults: TestResult[] = [
      {
        id: '1',
        testRequestId: '1',
        testRequest: {
          id: '1',
          patientId: '1',
          facilityId: 'flnt',
          tests: [],
          urgency: 'Routine',
          status: 'In Progress',
          requestedBy: 'user1',
          requestedAt: new Date('2024-12-24T09:00:00'),
        },
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
        technicianId: 'user2',
        technician: {
          id: 'user2',
          email: 'technician@labsync.ug',
          name: 'John Technician',
          role: 'lab_technician',
          facilityId: 'flnt',
          isActive: true,
          createdAt: new Date(),
        },
        resultValues: [
          {
            parameter: 'Hemoglobin',
            value: 14.5,
            unit: 'g/dL',
            normalRange: '13.0-17.0',
            flag: 'Normal',
            isAbnormal: false,
          },
          {
            parameter: 'White Blood Cell Count',
            value: 8500,
            unit: 'cells/μL',
            normalRange: '4,000-11,000',
            flag: 'Normal',
            isAbnormal: false,
          },
          {
            parameter: 'Platelet Count',
            value: 320000,
            unit: 'thousand/μL',
            normalRange: '150,000-450,000',
            flag: 'Normal',
            isAbnormal: false,
          },
        ],
        remarks: 'All parameters within normal limits',
        datePerformed: new Date('2024-12-24T11:00:00'),
        status: 'Completed',
        qualityControl: {
          controlSample: 'Normal Control',
          controlValue: 'Within Range',
          isPassed: true,
          notes: 'Quality control passed',
        },
      },
      {
        id: '2',
        testRequestId: '2',
        testRequest: {
          id: '2',
          patientId: '2',
          facilityId: 'flnt',
          tests: [],
          urgency: 'Urgent',
          status: 'In Progress',
          requestedBy: 'user1',
          requestedAt: new Date('2024-12-24T10:30:00'),
        },
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
        technicianId: 'user2',
        technician: {
          id: 'user2',
          email: 'technician@labsync.ug',
          name: 'John Technician',
          role: 'lab_technician',
          facilityId: 'flnt',
          isActive: true,
          createdAt: new Date(),
        },
        resultValues: [
          {
            parameter: 'Beta HCG',
            value: 1250,
            unit: 'mIU/mL',
            normalRange: '0-5',
            flag: 'High',
            isAbnormal: true,
          },
        ],
        remarks: 'Positive result - pregnancy confirmed',
        datePerformed: new Date('2024-12-24T12:30:00'),
        status: 'Pending',
        qualityControl: {
          controlSample: 'Positive Control',
          controlValue: 'Expected Range',
          isPassed: true,
          notes: 'Quality control passed',
        },
      },
    ];

    setTestResults(mockResults);
    setFilteredResults(mockResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = testResults;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.test?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.test?.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    setFilteredResults(filtered);
  }, [searchTerm, statusFilter, testResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Completed':
        return <Microscope className="h-4 w-4 text-blue-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'Rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case 'Normal':
        return 'text-green-600';
      case 'Low':
        return 'text-blue-600';
      case 'High':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleEdit = (result: TestResult) => {
    setSelectedResult(result);
    setIsFormOpen(true);
  };

  const handleView = (result: TestResult) => {
    setSelectedResult(result);
    // In a real app, this would navigate to a detailed view
    console.log('View result:', result);
  };

  const handleApprove = (resultId: string) => {
    setTestResults(results =>
      results.map(result =>
        result.id === resultId 
          ? { 
              ...result, 
              status: 'Approved',
              dateApproved: new Date(),
              approvedBy: user?.id || '',
            } 
          : result
      )
    );
  };

  const handleReject = (resultId: string) => {
    setTestResults(results =>
      results.map(result =>
        result.id === resultId 
          ? { 
              ...result, 
              status: 'Rejected',
            } 
          : result
      )
    );
  };

  const handleFormSubmit = (resultData: Omit<TestResult, 'id' | 'datePerformed'>) => {
    if (selectedResult) {
      // Update existing result
      const updatedResults = testResults.map(r =>
        r.id === selectedResult.id
          ? { ...r, ...resultData }
          : r
      );
      setTestResults(updatedResults);
      setFilteredResults(updatedResults);
    } else {
      // Add new result
      const newResult: TestResult = {
        ...resultData,
        id: Date.now().toString(),
        datePerformed: new Date(),
      };
      setTestResults([newResult, ...testResults]);
      setFilteredResults([newResult, ...filteredResults]);
    }
    setIsFormOpen(false);
    setSelectedResult(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600 mt-2">
            Manage laboratory test results and approvals
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search results by patient name, ID, or test name..."
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
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results List */}
      <div className="grid gap-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No test results found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No test results available'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.patient?.givenName} {result.patient?.surname}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {result.patient?.patientId} | Test: {result.test?.name} ({result.test?.code})
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                          <span className="ml-1">{result.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Performed:</strong> {formatDate(result.datePerformed)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Technician:</strong> {result.technician?.name}
                        </p>
                        {result.dateApproved && (
                          <p className="text-sm text-gray-600">
                            <strong>Approved:</strong> {formatDate(result.dateApproved)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Sample Type:</strong> {result.test?.sampleType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Turnaround Time:</strong> {result.test?.turnaroundTime}
                        </p>
                        {result.qualityControl && (
                          <p className="text-sm text-gray-600">
                            <strong>QC Status:</strong> {result.qualityControl.isPassed ? 'Passed' : 'Failed'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Result Values */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Results:</h4>
                      <div className="space-y-1">
                        {result.resultValues.map((value, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{value.parameter}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${getFlagColor(value.flag)}`}>
                                {value.value} {value.unit}
                              </span>
                              <span className="text-gray-500">({value.normalRange})</span>
                              <span className={`text-xs px-2 py-1 rounded ${getFlagColor(value.flag)} bg-opacity-10`}>
                                {value.flag}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.remarks && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Remarks:</strong> {result.remarks}
                        </p>
                      </div>
                    )}

                    {result.qualityControl?.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>QC Notes:</strong> {result.qualityControl.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {result.test?.price && `Test Fee: ${formatCurrency(result.test.price)}`}
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.status === 'Completed' && user?.role === 'owner' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(result.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(result.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user?.role === 'lab_technician' && result.status === 'Pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(result)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Test Result Form Modal */}
      {isFormOpen && (
        <TestResultForm
          result={selectedResult}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedResult(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}