'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Printer, Search, Eye, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult, Patient, Test, Facility, User } from '@/types';
import ClinicalReport from '@/components/reports/ClinicalReport';

interface ReportWithDetails extends TestResult {
  patient?: Patient;
  test?: Test;
  performedByUser?: User;
  approvedByUser?: User;
}

export default function ReadyReportsPage() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Load facility data
    const loadFacility = async () => {
      try {
        const facilityData = await firestoreService.getById<Facility>(COLLECTIONS.FACILITIES, userProfile.facilityId);
        setFacility(facilityData);
      } catch (error) {
        console.error('Error loading facility:', error);
      }
    };

    loadFacility();

    // Subscribe to approved test results ready for printing
    const reportsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId),
      where('status', '==', 'Approved'),
      orderBy('dateApproved', 'desc')
    );

    const unsubscribe = onSnapshot(reportsQuery, async (snapshot) => {
      const reportsData: ReportWithDetails[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data() || {};
        const reportData = {
          id: doc.id,
          ...data,
          datePerformed: data.datePerformed?.toDate?.() || new Date(),
          dateSubmitted: data.dateSubmitted?.toDate?.() || new Date(),
          dateApproved: data.dateApproved?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as ReportWithDetails;

        // Load patient data
        if (reportData.patientId) {
          try {
            const patient = await firestoreService.getById(COLLECTIONS.PATIENTS, reportData.patientId);
            reportData.patient = patient as Patient;
          } catch (error) {
            console.error('Error loading patient:', error);
          }
        }

        // Load test data
        if (reportData.testId) {
          try {
            const test = await firestoreService.getById(COLLECTIONS.TESTS, reportData.testId);
            reportData.test = test as Test;
          } catch (error) {
            console.error('Error loading test:', error);
          }
        }

        // Load performed by user data
        if (reportData.performedBy) {
          try {
            const user = await firestoreService.getById(COLLECTIONS.USERS, reportData.performedBy);
            reportData.performedByUser = user as User;
          } catch (error) {
            console.error('Error loading user:', error);
          }
        }

        // Load approved by user data
        if (reportData.approvedBy) {
          try {
            const user = await firestoreService.getById(COLLECTIONS.USERS, reportData.approvedBy);
            reportData.approvedByUser = user as User;
          } catch (error) {
            console.error('Error loading approver:', error);
          }
        }

        reportsData.push(reportData);
      }

      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.test?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm]);

  const handlePrint = async (reportId: string) => {
    try {
      setPrinting(true);

      // Mark as printed
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, reportId, {
        printedBy: userProfile?.id,
        printedDate: new Date(),
        status: 'Printed',
        updatedAt: new Date(),
      });

      // Print the report
      window.print();

      alert('Report printed successfully!');
      setSelectedReport(null);
    } catch (error) {
      console.error('Error marking as printed:', error);
      alert('Failed to mark report as printed');
    } finally {
      setPrinting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ready Reports</h1>
          <p className="text-gray-600 mt-1">
            Approved test reports ready for printing and patient collection
          </p>
        </div>

        {selectedReport ? (
          /* Report View */
          <div className="space-y-6">
            {/* Report Actions */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Patient Report</h2>
                  <p className="text-sm text-gray-600">
                    Patient: {selectedReport.patient?.surname}, {selectedReport.patient?.givenName} 
                    ({selectedReport.patient?.patientId})
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                  >
                    Back to List
                  </Button>
                  <Button
                    onClick={() => handlePrint(selectedReport.id)}
                    isLoading={printing}
                    className="no-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print & Mark as Collected
                  </Button>
                </div>
              </div>
            </Card>

            {/* Clinical Report */}
            {facility && selectedReport.test && selectedReport.patient && (
              <ClinicalReport
                testResult={selectedReport}
                patient={selectedReport.patient}
                test={selectedReport.test}
                facility={facility}
                performedBy={selectedReport.performedByUser}
                approvedBy={selectedReport.approvedByUser}
                reportId={`RPT-${selectedReport.id.slice(-8).toUpperCase()}`}
              />
            )}
          </div>
        ) : (
          /* Reports List */
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by patient ID, name, or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:ring-0"
                />
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Ready for Print</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {reports.filter(r => !r.printedDate).length}
                    </p>
                  </div>
                  <Printer className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Printed Today</p>
                    <p className="text-2xl font-bold text-green-900">
                      {reports.filter(r => {
                        if (!r.printedDate) return false;
                        const today = new Date();
                        const printDate = new Date(r.printedDate);
                        return printDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total Reports</p>
                    <p className="text-2xl font-bold text-purple-900">{reports.length}</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Reports List */}
            <Card>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <Printer className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No reports ready
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? 'Try a different search term'
                      : 'No approved reports are ready for printing'}
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
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium text-primary">
                            {report.patient?.patientId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {report.patient?.surname} {report.patient?.givenName}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {report.test?.name}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {report.dateApproved ? formatDate(report.dateApproved) : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            {report.printedDate ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Printed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Printer className="w-3 h-3 mr-1" />
                                Ready
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {!report.printedDate && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePrint(report.id)}
                                  isLoading={printing}
                                >
                                  <Printer className="w-4 h-4 mr-1" />
                                  Print
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}