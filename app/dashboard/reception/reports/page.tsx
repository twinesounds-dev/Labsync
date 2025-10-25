'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FileText, Search, Printer, Download } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { Patient, TestResult } from '@/types';
import { format } from 'date-fns';

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const [approvedResults, setApprovedResults] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to approved test results
    const resultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId),
      where('status', '==', 'Approved'),
      orderBy('dateApproved', 'desc')
    );

    const unsubscribe = onSnapshot(resultsQuery, (snapshot) => {
      const resultsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        datePerformed: doc.data().datePerformed?.toDate() || new Date(),
        dateSubmitted: doc.data().dateSubmitted?.toDate() || new Date(),
        dateApproved: doc.data().dateApproved?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestResult[];

      setApprovedResults(resultsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const handlePrintReport = (result: TestResult) => {
    // This will integrate with the PDF generator
    alert(`Printing report for test result ID: ${result.id}`);
    window.print();
  };

  const filteredResults = approvedResults.filter((result) =>
    result.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.patient?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.patient?.givenName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Reports</h1>
            <p className="text-gray-600 mt-1">
              Print approved test reports for patients
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
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

        {/* Reports List */}
        <Card>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No reports found' : 'No approved reports yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Approved test results will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Test
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Approved Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-primary">
                        {result.patient?.patientId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {result.patient?.surname} {result.patient?.givenName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {result.test?.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {result.dateApproved
                          ? format(result.dateApproved, 'dd MMM yyyy HH:mm')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          onClick={() => handlePrintReport(result)}
                          className="flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
