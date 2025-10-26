'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FileText, Download, Eye, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { TestResult, TestRequest } from '@/types';

export default function TestResultsPage() {
  const { userProfile } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [requests, setRequests] = useState<{ [key: string]: TestRequest }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to test results
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId),
      orderBy('datePerformed', 'desc')
    );

    const unsubscribeResults = onSnapshot(resultsQuery, async (snapshot) => {
      const resultsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        datePerformed: doc.data().datePerformed?.toDate() || new Date(),
      })) as TestResult[];

      setResults(resultsData);

      // Fetch corresponding test requests
      const requestIds = [...new Set(resultsData.map(result => result.testRequestId))];
      const requestsData: { [key: string]: TestRequest } = {};

      for (const requestId of requestIds) {
        try {
          const requestQuery = query(
            collection(db, COLLECTIONS.TEST_REQUESTS),
            where('__name__', '==', requestId)
          );
          
          const requestSnapshot = await new Promise<any>((resolve) => {
            const unsubscribe = onSnapshot(requestQuery, (snapshot) => {
              unsubscribe();
              resolve(snapshot);
            });
          });

          if (!requestSnapshot.empty) {
            const requestDoc = requestSnapshot.docs[0];
            requestsData[requestId] = {
              id: requestDoc.id,
              ...requestDoc.data(),
              requestDate: requestDoc.data().requestDate?.toDate() || new Date(),
            } as TestRequest;
          }
        } catch (error) {
          console.error('Error fetching request:', error);
        }
      }

      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribeResults();
  }, [userProfile?.facilityId]);

  const filteredResults = results.filter((result) => {
    const request = requests[result.testRequestId];
    const matchesSearch = !searchTerm || 
      request?.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request?.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request?.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Submitted': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800' },
      'Printed': { bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Submitted;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading test results...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600 mt-1">
            View and manage completed test results
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by patient ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Printed">Printed</option>
              </select>
            </div>
          </div>
        </Card>

        {filteredResults.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Test Results Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No results match your search criteria.' 
                  : 'Test results will appear here once lab work is completed.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const request = requests[result.testRequestId];
              
              return (
                <Card key={result.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request?.patient?.surname} {request?.patient?.givenName}
                          </h3>
                          <span className="text-sm text-gray-600">
                            ID: {request?.patient?.patientId}
                          </span>
                          {getStatusBadge(result.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Performed: {result.datePerformed.toLocaleDateString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Test: </span>
                          <span className="font-medium">{result.test?.name || 'Unknown Test'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Performed By: </span>
                          <span className="font-medium">{result.performedBy}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Gender: </span>
                          <span className="font-medium">{request?.patient?.gender}</span>
                        </div>
                      </div>

                      {result.remarks && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">Lab Notes: </span>
                          <span className="text-sm text-gray-700">{result.remarks}</span>
                        </div>
                      )}

                      {/* Result Values Preview */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Results:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {result.resultValues?.map((value, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{value.parameter}: </span>
                              <span className={`${
                                value.flag === 'High' || value.flag === 'Critical' 
                                  ? 'text-red-600 font-medium' 
                                  : value.flag === 'Low' 
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-800'
                              }`}>
                                {value.value} {value.unit}
                              </span>
                              {value.flag !== 'Normal' && value.flag !== 'N/A' && (
                                <span className={`ml-1 text-xs px-1 py-0.5 rounded ${
                                  value.flag === 'High' || value.flag === 'Critical' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {value.flag}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <Link href={`/dashboard/reception/test-results/${result.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Button>
                      </Link>
                      
                      {result.status === 'Approved' && (
                        <Button size="sm" className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Print Report</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}